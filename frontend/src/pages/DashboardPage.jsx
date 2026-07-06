import Layout from "../components/Layout";
import { useAuth } from "../context/AuthContext";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <Layout>
      <div
        style={{
          width: "100%",
          maxWidth: "900px",
          margin: "0 auto"
        }}
      >
        <h1>Dashboard</h1>

        <p>Welcome {user?.full_name}</p>

        <p>Role: {user?.role}</p>
      </div>
    </Layout>
  );
}