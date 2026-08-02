"use client";

import { Component, type ReactNode } from "react";

interface SceneErrorBoundaryProps {
  onError: () => void;
  children: ReactNode;
}

interface SceneErrorBoundaryState {
  failed: boolean;
}

// WebGL/Three.js sahnesi çalışırken hata verirse (context kaybı, shader derleme
// hatası vb.) CSS fallback'e geçişi tetikler — kullanıcı fark etmez.
export default class SceneErrorBoundary extends Component<
  SceneErrorBoundaryProps,
  SceneErrorBoundaryState
> {
  state: SceneErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): SceneErrorBoundaryState {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    if (this.state.failed) return null;
    return this.props.children;
  }
}
