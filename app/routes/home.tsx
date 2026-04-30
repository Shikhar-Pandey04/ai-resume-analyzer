import type { Route } from "./+types/home";
import Navbar from "~/components/Navbar";
import ResumeCard from "~/components/ResumeCard";
import { usePuterStore } from "~/lib/puter";
import { Link, useNavigate } from "react-router";
import { useEffect, useState } from "react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Resumind" },
    { name: "description", content: "Smart feedback for your dream job!" },
  ];
}

export default function Home() {
  // ✅ SAFE STORE ACCESS
  const auth = usePuterStore((state) => state.auth);
  const kv = usePuterStore((state) => state.kv);

  const navigate = useNavigate();

  const [resumes, setResumes] = useState<any[]>([]);
  const [loadingResumes, setLoadingResumes] = useState(false);

  // 🔐 AUTH CHECK (SAFE)
  useEffect(() => {
    if (auth && auth.isAuthenticated === false) {
      navigate("/auth?next=/");
    }
  }, [auth, navigate]);

  // 📦 LOAD RESUMES
  useEffect(() => {
    const loadResumes = async () => {
      try {
        setLoadingResumes(true);

        // ⚠️ SAFETY CHECK
        if (!kv?.list) {
          console.warn("KV list not available");
          setLoadingResumes(false);
          return;
        }

        const resumes = await kv.list("resume:*", true);

        const parsedResumes =
          resumes?.map((item: any) => {
            try {
              return JSON.parse(item.value);
            } catch {
              return null;
            }
          }).filter(Boolean) || [];

        setResumes(parsedResumes);
      } catch (err) {
        console.error("Load resumes error:", err);
      } finally {
        setLoadingResumes(false);
      }
    };

    loadResumes();
  }, [kv]);

  return (
    <main className="bg-[url('/images/bg-main.svg')] bg-cover min-h-screen">
      <Navbar />

      <section className="main-section">
        <div className="page-heading py-16">
          <h1>Track Your Applications & Resume Ratings</h1>

          {!loadingResumes && resumes.length === 0 ? (
            <h2>No resumes found. Upload your first resume to get feedback.</h2>
          ) : (
            <h2>Review your submissions and check AI-powered feedback.</h2>
          )}
        </div>

        {/* 🔄 LOADING */}
        {loadingResumes && (
          <div className="flex flex-col items-center justify-center">
            <img src="/images/resume-scan-2.gif" className="w-[200px]" />
          </div>
        )}

        {/* 📄 RESUME LIST */}
        {!loadingResumes && resumes.length > 0 && (
          <div className="resumes-section">
            {resumes.map((resume: any) => (
              <ResumeCard key={resume.id} resume={resume} />
            ))}
          </div>
        )}

        {/* ➕ EMPTY STATE */}
        {!loadingResumes && resumes.length === 0 && (
          <div className="flex flex-col items-center justify-center mt-10 gap-4">
            <Link to="/upload" className="primary-button w-fit text-xl font-semibold">
              Upload Resume
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}