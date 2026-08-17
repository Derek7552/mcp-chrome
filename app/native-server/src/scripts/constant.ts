export const COMMAND_NAME = 'mcp-chrome-bridge';
// 由扩展固定公钥计算出的恒定 ID（见 app/chrome-extension/wxt.config.ts EXTENSION_KEY）
// 推导方式：sha256(DER 公钥) 前 16 字节 → hex → 每位 0-f 映射到 a-p（Chromium components/crx_file/id_util.cc）
export const EXTENSION_ID = 'chdmlehgmfaiegppnpehheogfpmigkkj';
export const HOST_NAME = 'com.chromemcp.nativehost';
export const DESCRIPTION = 'Node.js Host for Browser Bridge Extension';
