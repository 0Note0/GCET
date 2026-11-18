if (typeof window !== 'undefined') {
  await import('@testing-library/jest-dom/vitest');

  if (typeof window.matchMedia === 'undefined') {
    window.matchMedia = (query: string): MediaQueryList => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    });
  }

  if (typeof window.IntersectionObserver === 'undefined') {
    class MockIntersectionObserver implements IntersectionObserver {
      readonly root: Element | Document | null = null;
      readonly rootMargin: string = '';
      readonly scrollMargin: string = '';
      readonly thresholds: ReadonlyArray<number> = [];
      disconnect(): void {}
      observe(): void {}
      takeRecords(): IntersectionObserverEntry[] {
        return [];
      }
      unobserve(): void {}
    }
    window.IntersectionObserver = MockIntersectionObserver;
    globalThis.IntersectionObserver = MockIntersectionObserver;
  }

  if (typeof window.ResizeObserver === 'undefined') {
    class MockResizeObserver implements ResizeObserver {
      disconnect(): void {}
      observe(): void {}
      unobserve(): void {}
    }
    window.ResizeObserver = MockResizeObserver;
    globalThis.ResizeObserver = MockResizeObserver;
  }
}
