class Toast {
  message = $state<string | null>(null);
  #timer: ReturnType<typeof setTimeout> | undefined;

  show(message: string, ms = 3000) {
    this.message = message;
    clearTimeout(this.#timer);
    this.#timer = setTimeout(() => (this.message = null), ms);
  }
}

export const toast = new Toast();
