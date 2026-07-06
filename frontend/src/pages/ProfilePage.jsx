import Layout from "../components/Layout";
import { useAuth } from "../context/AuthContext";

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <Layout>
      <h1>Profile</h1>

      <p>
        <strong>Name:</strong> {user?.full_name}
      </p>

      <p>
        <strong>Email:</strong> {user?.email}
      </p>

      <p>
        <strong>Role:</strong> {user?.role}
      </p>
    </Layout>
  );
}