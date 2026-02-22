function ScreenLoad() {
    return (
      <div className="loading-overlay">
        <dotlottie-player
          src="https://lottie.host/92a32428-fba6-462c-a575-ac48bdd9848a/0R9xDNtxsE.lottie"
          background="transparent"
          speed="1"
          style={{ width: "300px", height: "300px" }}  // ✅ Fixed style
          loop
          autoplay
        ></dotlottie-player>
        {/* <div className="loading-spinner"></div>
        <p>Loading user data...</p> */}
      </div>
    );
  }
  
  export default ScreenLoad;
  