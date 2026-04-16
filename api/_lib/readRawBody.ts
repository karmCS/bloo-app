export async function readRawBody(req: {
  on: (event: 'data' | 'end' | 'error', cb: (chunk?: unknown) => void) => void;
}): Promise<Buffer> {
  const chunks: Buffer[] = [];

  return await new Promise<Buffer>((resolve, reject) => {
    req.on('data', (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
    });
    req.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
    req.on('error', (err) => {
      reject(err);
    });
  });
}

