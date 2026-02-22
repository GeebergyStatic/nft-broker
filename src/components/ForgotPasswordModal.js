import { useState } from 'react';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!email) return toast.error("Please enter your email.");

    setIsLoading(true);
    const auth = getAuth();

    try {
      await sendPasswordResetEmail(auth, email);
      toast.success("Password reset email sent successfully.");
      setEmail('');
    } catch (error) {
      toast.error("Failed to send reset email. Please check your email address.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <ToastContainer />
      <div style={styles.card}>
        <h2 style={styles.heading}>Forgot Password</h2>
        <p style={styles.subheading}>Enter your email to receive a password reset link.</p>
        <form onSubmit={handleResetPassword} style={styles.form}>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
            required
          />
          <button
            type="submit"
            disabled={isLoading}
            style={{
              ...styles.button,
              backgroundColor: isLoading ? '#94a3b8' : '#4f46e5',
              cursor: isLoading ? 'not-allowed' : 'pointer'
            }}
          >
            {isLoading ? (
              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            ) : (
              "Send Reset Email"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: '2rem',
  },
  card: {
    background: '#fff',
    padding: '2rem',
    borderRadius: '12px',
    boxShadow: '0 6px 24px rgba(0, 0, 0, 0.08)',
    maxWidth: '400px',
    width: '100%',
    textAlign: 'center'
  },
  heading: {
    fontSize: '1.8rem',
    marginBottom: '0.5rem',
    color: '#1e293b',
  },
  subheading: {
    fontSize: '1rem',
    marginBottom: '1.5rem',
    color: '#64748b',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  input: {
    padding: '12px',
    borderRadius: '6px',
    fontSize: '16px',
    border: '1px solid #cbd5e1',
  },
  button: {
    padding: '12px',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontWeight: 'bold',
  }
};

export default ForgotPassword;
