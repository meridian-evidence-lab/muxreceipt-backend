export const TESTNET_PASSPHRASE='Test SDF Network ; September 2015';
export const SDK_VERSION='17.3.0';
const fail=(status,message)=>Object.assign(new Error(message),{status});
const hex=(value,label)=>{if(typeof value!=='string'||!/^[a-f0-9]{64}$/.test(value))throw fail(422,`Invalid ${label}: expected lowercase 32-byte hex`);return value;};
export async function verifyRegistry(project,input,config,{client=null}={}){
 if(!['muxreceipt','ledgerorder'].includes(project))throw fail(422,'Unknown registry project');
 if(!config?.rpcUrl||!config.contractId||!config.wasmHash)throw fail(503,'Configure TESTNET_RPC_URL, TESTNET_CONTRACT_ID and TESTNET_WASM_HASH');
 const endpoint=new URL(config.rpcUrl);if(endpoint.protocol!=='https:')throw fail(422,'Testnet RPC requires HTTPS');
 hex(config.wasmHash,'configured WASM hash');
 const sdk=await import('@stellar/stellar-sdk');
 if(!sdk.StrKey.isValidContract(config.contractId))throw fail(422,'Invalid configured contract address');
 let key,expected;
 if(project==='muxreceipt'){
  hex(input?.scope,'scope');hex(input?.expectedCommitment,'expected commitment');
  if(!Number.isSafeInteger(input.revision)||input.revision<1||input.revision>4294967295)throw fail(422,'Invalid mapping revision');
  key=sdk.xdr.ScVal.scvVec([sdk.xdr.ScVal.scvSymbol('Version'),sdk.xdr.ScVal.scvBytes(Buffer.from(input.scope,'hex')),sdk.xdr.ScVal.scvU32(input.revision)]);
  expected={revision:input.revision,commitment:input.expectedCommitment};
 }else{
  for(const field of ['reportDigest','expectedInputDigest','expectedScopeDigest'])hex(input?.[field],field);
  if(!sdk.StrKey.isValidEd25519PublicKey(input?.publisher)&&!sdk.StrKey.isValidContract(input?.publisher))throw fail(422,'Publisher must be a valid base account or contract address');
  key=sdk.xdr.ScVal.scvVec([sdk.xdr.ScVal.scvSymbol('Anchor'),new sdk.Address(input.publisher).toScVal(),sdk.xdr.ScVal.scvBytes(Buffer.from(input.reportDigest,'hex'))]);
  expected={report_digest:input.reportDigest,input_digest:input.expectedInputDigest,scope_digest:input.expectedScopeDigest};
 }
 const server=client??new sdk.rpc.Server(config.rpcUrl,{timeout:4000});
 try{
  const network=await server.getNetwork();if(network.passphrase!==TESTNET_PASSPHRASE)throw fail(409,'RPC network is not Stellar testnet');
  const instance=await server.getContractInstance(config.contractId);
  if(instance.executable.type!=='contractExecutableWasm'||instance.executable.wasmHash.toString()!==config.wasmHash)throw fail(409,'Deployed contract WASM does not match the pinned hash');
  const entry=await server.getContractData(config.contractId,key,sdk.rpc.Durability.Persistent);
  if(entry.val?.type!=='contractData')throw fail(502,'RPC returned an unexpected ledger entry type');
  const data=entry.val.value;
  if(sdk.Address.fromScAddress(data.contract).toString()!==config.contractId||data.key.toXdr('base64')!==key.toXdr('base64'))throw fail(502,'RPC returned a different contract or storage key');
  const raw=sdk.scValToNative(data.val);const record={};
  for(const field of Object.keys(expected))record[field]=typeof expected[field]==='number'?raw[field]:Buffer.from(raw[field]??[]).toString('hex');
  if(!Number.isSafeInteger(raw.recorded_ledger)||raw.recorded_ledger<1)throw fail(502,'Invalid recorded ledger');record.recorded_ledger=raw.recorded_ledger;
  for(const [field,value]of Object.entries(expected))if(record[field]!==value)throw fail(409,`Registry ${field} does not match the expected value`);
  return {verified:true,project,network:'testnet',contractId:config.contractId,wasmHash:config.wasmHash,record,lastModifiedLedger:entry.lastModifiedLedgerSeq??null,liveUntilLedger:entry.liveUntilLedgerSeq??null,checkedAt:new Date().toISOString(),sdk:SDK_VERSION,trust:'TLS RPC-reported ledger entry; not an independently verified consensus proof'};
 }catch(error){if(error.status)throw error;if(error.code===404)throw fail(404,'Registry record unavailable: missing or archived; this is not proof of absence');throw fail(502,'Testnet registry read failed');}
}
