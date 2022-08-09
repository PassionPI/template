interface OnMessage {
  (this: Window, ev: MessageEvent): void;
}

interface PostMessage {
  <T>(message: T, options?: unknown): void;
  <T>(
    message: T,
    targetOrigin: string,
    transfer?: Transferable[] | undefined
  ): void;
}

declare interface Window {
  onmessage: OnMessage;
  postMessage: PostMessage;
}
