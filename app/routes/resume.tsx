import { Link, useNavigate, useParams } from "react-router";
import { useEffect, useState } from "react";
import { usePuterStore } from "~/lib/puter";
import Summary from "~/components/Summary";
import ATS from "~/components/ATS";
import Details from "~/components/Details";

export const meta = () => ([
  { title: "Resumind | Review" },
  { name: "description", content: "Detailed overview of your resume" },
]);

const Resume = () => {
  const { auth, isLoading, fs, kv } = usePuterStore();
  const { id } = useParams();
  const navigate = useNavigate();

  const [imageUrl, setImageUrl] = useState<string>("");
  const [resumeUrl, setResumeUrl] = useState<string>("");
  const [feedback, setFeedback] = useState<any>(null);

  // 🔐 AUTH CHECK
  useEffect(() => {
    if (!isLoading && !auth.isAuthenticated) {
      navigate(`/auth?next=/resume/${id}`);
    }
  }, [isLoading, auth.isAuthenticated, id, navigate]);

  // 📂 LOAD RESUME DATA
  useEffect(() => {
    const loadResume = async () => {
      try {
        const resume = await kv.get(`resume:${id}`);
        if (!resume) return;

        const data = JSON.parse(resume);

        // 📄 Resume PDF
        const resumeBlob = await fs.read(data.resumePath);
        if (resumeBlob) {
          const pdfBlob = new Blob([resumeBlob], {
            type: "application/pdf",
          });
          const url = URL.createObjectURL(pdfBlob);
          setResumeUrl(url);
        }

        // 🖼️ Image Preview
        const imageBlob = await fs.read(data.imagePath);
        if (imageBlob) {
          const url = URL.createObjectURL(imageBlob);
          setImageUrl(url);
        }

        // 🤖 Feedback
        setFeedback(data.feedback);

        console.log("🔥 FINAL DATA:", data);
      } catch (err) {
        console.error("❌ LOAD ERROR:", err);
      }
    };

    if (id) loadResume();
  }, [id, fs, kv]);

  return (
    <main className="!pt-0">
      {/* 🔙 NAV */}
      <nav className="resume-nav">
        <Link to="/" className="back-button">
          <img src="/icons/back.svg" alt="back" className="w-2.5 h-2.5" />
          <span className="text-gray-800 text-sm font-semibold">
            Back to Homepage
          </span>
        </Link>
      </nav>

      <div className="flex flex-row w-full max-lg:flex-col-reverse">
        
        {/* 🖼️ LEFT SIDE */}
        <section className="feedback-section bg-[url('/images/bg-small.svg')] bg-cover h-[100vh] sticky top-0 flex items-center justify-center">
          {imageUrl && resumeUrl ? (
            <div className="animate-in fade-in duration-1000 gradient-border h-[90%] w-fit">
              <a href={resumeUrl} target="_blank" rel="noopener noreferrer">
                <img
                  src={imageUrl}
                  className="w-full h-full object-contain rounded-2xl"
                  alt="resume"
                />
              </a>
            </div>
          ) : (
            <p>Loading preview...</p>
          )}
        </section>

        {/* 📊 RIGHT SIDE */}
        <section className="feedback-section p-6">
          <h2 className="text-4xl !text-black font-bold">
            Resume Review
          </h2>

          {feedback ? (
            <div className="flex flex-col gap-8 animate-in fade-in duration-1000 mt-6">
              
              {/* 🧾 SUMMARY */}
              <Summary feedback={feedback} />

              {/* 📈 ATS */}
              <ATS
                score={feedback?.ATS?.score || 0}
                suggestions={feedback?.ATS?.tips || []}
              />

              {/* 📋 DETAILS */}
              <Details feedback={feedback} />

            </div>
          ) : (
            <img src="/images/resume-scan-2.gif" className="w-full mt-6" />
          )}
        </section>

      </div>
    </main>
  );
};

export default Resume;