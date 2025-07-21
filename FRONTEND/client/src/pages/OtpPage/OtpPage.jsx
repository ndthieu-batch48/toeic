import CircularProgress from '@mui/material/CircularProgress';

const OtpPage = () => {
  const isLoading = false;
  const isResending = false;

  return (
    <div className="container d-flex flex-column align-items-center justify-content-center min-vh-100">
      <h2 className="mb-4">Enter OTP</h2>
      <form>
        <div className="d-flex justify-content-center gap-2 mb-3">
          {[...Array(6)].map((_, index) => (
            <input
              key={index}
              type="text"
              className="form-control text-center"
              maxLength="1"
              style={{
                width: '4rem',
                height: '4rem',
                fontSize: '2rem',
                fontWeight: 'bold',
                borderRadius: '0',
              }}
            />
          ))}
        </div>
        <div className="text-center">
          <button
            type="submit"
            disabled={isLoading || isResending}
            className="btn btn-primary w-100 py-3 mb-3 fs-5">
            {isLoading ? (
              <>
                <CircularProgress size={20} className="me-2" />
                Sending...
              </>
            ) : (
              'Send Reset Email'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default OtpPage;
