import { generate } from './puzzle';

self.onmessage = (e: MessageEvent<{ n: number; seed: number }>) => {
  const { n, seed } = e.data;
  (self as unknown as Worker).postMessage(generate(n, seed));
};
