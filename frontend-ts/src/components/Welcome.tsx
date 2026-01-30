import { Navigate } from 'react-router-dom';

function Welcome() {
  return <Navigate to="/login" replace={true} />;
}

export default Welcome;