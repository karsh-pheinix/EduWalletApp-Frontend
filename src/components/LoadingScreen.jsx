import "./LoadingScreen.css";

function LoadingScreen({ message = "Setting up your wallet..." }) {
  return (
    <div className="loading-screen">
      <div className="loading-spinner" />
      <p className="loading-message">{message}</p>
    </div>
  );
}

export default LoadingScreen;