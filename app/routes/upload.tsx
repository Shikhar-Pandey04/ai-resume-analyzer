import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import FileUploader from "../components/FileUploader";
import Navbar from "../components/Navbar";

import { usePuterStore } from "~/lib/puter";
import { convertPdfToImage } from "~/lib/pdf2img";
import { generateUUID } from "~/lib/utils";
import { prepareInstructions } from "~/constants";

const Upload = () => {
  const fs = usePuterStore((state) => state.fs);
  const ai = usePuterStore((state) => state.ai);
  const kv = usePuterStore((state) => state.kv);

  const navigate = useNavigate();

  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);

  // 📂 file select
  const handleFileSelect = (file: File | null) => {
    setFile(file);
  };

  // 🔥 MAIN LOGIC
  const handleAnalyze = async ({
    file,
    companyName,
    jobTitle,
    jobDescription,
  }: {
    file: File;
    companyName: string;
    jobTitle: string;
    jobDescription: string;
  }) => {
    setIsProcessing(true);

    try {
      // 📤 Upload PDF
      setStatusText("Uploading resume...");
      const uploadedFile = await fs.upload([file]);

      if (!uploadedFile?.path) {
        setStatusText("❌ Failed to upload resume");
        return;
      }

      // 🖼️ Convert PDF → Image
      setStatusText("Converting to image...");
      const imageFile = await convertPdfToImage(file);

      if (!imageFile?.file) {
        setStatusText("❌ PDF conversion failed");
        return;
      }

      // 📤 Upload image
      setStatusText("Uploading image...");
      const uploadedImage = await fs.upload([imageFile.file]);

      if (!uploadedImage?.path) {
        setStatusText("❌ Failed to upload image");
        return;
      }

      // 🧠 Prepare data
      setStatusText("Preparing data...");
      const uuid = generateUUID();

      const data: any = {
        id: uuid,
        resumePath: uploadedFile.path,
        imagePath: uploadedImage.path,
        companyName,
        jobTitle,
        jobDescription,
        feedback: null,
      };

      await kv.set(`resume:${uuid}`, JSON.stringify(data));

      // 🤖 AI feedback
      setStatusText("Analyzing resume...");
      const feedback = await ai.feedback(
        uploadedFile.path,
        prepareInstructions({ jobTitle, jobDescription })
      );

      if (!feedback) {
        setStatusText("❌ AI analysis failed");
        return;
      }

      // 🧾 Extract safely
      const feedbackText =
        typeof feedback?.message?.content === "string"
          ? feedback.message.content
          : feedback?.message?.content?.[0]?.text || "";

      let parsedFeedback;

      try {
        parsedFeedback = JSON.parse(feedbackText);
      } catch (err) {
        console.error("JSON parse error:", feedbackText);
        setStatusText("❌ Invalid AI response");
        return;
      }

      // 💾 Save final data
      data.feedback = parsedFeedback;
      await kv.set(`resume:${uuid}`, JSON.stringify(data));

      // 🚀 Redirect
      setStatusText("✅ Done! Redirecting...");
      navigate(`/resume/${uuid}`);
    } catch (err) {
      console.error("FULL ERROR:", err);
      setStatusText("❌ Something went wrong");
    } finally {
      setIsProcessing(false);
    }
  };

  // 📝 FORM SUBMIT
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!file) {
      alert("Please upload a resume first!");
      return;
    }

    const formData = new FormData(e.currentTarget);

    const companyName = formData.get("company-name") as string;
    const jobTitle = formData.get("job-title") as string;
    const jobDescription = formData.get("job-description") as string;

    if (!companyName || !jobTitle || !jobDescription) {
      alert("Please fill all fields");
      return;
    }

    handleAnalyze({ file, companyName, jobTitle, jobDescription });
  };

  return (
    <main className="bg-[url('/images/bg-main.svg')] bg-cover min-h-screen">
      <Navbar />

      <section className="main-section">
        <div className="page-heading py-16 text-center">
          <h1>Smart feedback for your dream job</h1>

          {isProcessing ? (
            <>
              <h2 className="mt-4">{statusText}</h2>
              <img src="/images/resume-scan.gif" className="w-full mt-6" />
            </>
          ) : (
            <h2 className="mt-4">
              Drop your resume for an ATS score and improvement tips
            </h2>
          )}

          {!isProcessing && (
            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-4 mt-8 max-w-xl mx-auto"
            >
              <input
                name="company-name"
                placeholder="Company Name"
                className="input"
              />

              <input
                name="job-title"
                placeholder="Job Title"
                className="input"
              />

              <textarea
                name="job-description"
                placeholder="Job Description"
                className="input"
                rows={5}
              />

              {/* 🔥 FIXED LINE */}
              <FileUploader file={file} onFileSelect={handleFileSelect} />

              <button type="submit" className="primary-button">
                Analyze Resume
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
};

export default Upload;