import { Component } from 'react';

// Each route/module is wrapped separately, so a crash in one (e.g. the map)
// leaves the rest of the app usable.
export default class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error(`[${this.props.name}]`, error, info); }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="card" style={{ margin: '100px auto', maxWidth: 520, textAlign: 'center' }}>
        <h3>{this.props.name || 'This section'} hit a snag</h3>
        <p>The rest of KingMoversKenya still works. You can retry this part.</p>
        <button className="btn btn-primary" onClick={() => this.setState({ error: null })}>Retry</button>
      </div>
    );
  }
}
