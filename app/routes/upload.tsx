import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import FileUploader from '~/components/FileUploader';
import Navbar from '~/components/Navbar'
import { usePuterStore } from '~/lib/puter';
import { convertPdfToImage } from '~/lib/pdf2img';
import { generateUUID } from '~/lib/utils';
import { prepareInstructions } from '~/constants';

const Upload = () => {   // ✅ FIXED NAME (Capital U)

  const fs = usePuterStore((state) => state.fs);
  const ai = usePuterStore((state) => state.ai);
  const kv = usePuterStore((state) => state.kv);

  const navigate = useNavigate();

  const [isProcessing, setISProcessing] = useState(false);
  const [statusText, setStatusText] = useState<string>();
  const [file, setFile] = useState<File | null>(null);

  const handleFileSelect = (file: File | null) => {
    setFile(file);
  };

  const handleAnalyze = async ({
    file,
    companyName,
    jobTitle,
    jobDescription,
  }: {
    companyName: string;
    jobTitle: string;
    jobDescription: string;
    file: File;
  }) => {
    setISProcessing(true);

    try {
      setStatusText('Uploading the file...');
      const uploadedFile = await fs.upload([file]);

      if (!uploadedFile) {
        setStatusText('Error: Failed to upload file');
        return;
      }

      setStatusText('Converting to image...');
      const imageFile = await convertPdfToImage(file);

      if (!imageFile.file) {
        const errorMsg = imageFile.error || 'Failed to convert PDF to image';
        setStatusText(`Error: ${errorMsg}`);
        return;
      }

      setStatusText('Uploading the image...');
      const uploadedImage = await fs.upload([imageFile.file]);

      if (!uploadedImage) {
        setStatusText('Error: Failed to upload image');
        return;
      }

      setStatusText('Preparing Data...');
      const uuid = generateUUID();

      const data: any = {
        id: uuid,
        resumePath: uploadedFile.path,
        imagePath: uploadedImage.path,
        companyName,
        jobTitle,
        jobDescription,
        feedback: '',
      };

      await kv.set(`resume:${uuid}`, JSON.stringify(data));

      setStatusText('Analyzing...');
      const feedback = await ai.feedback(
        uploadedFile.path,
        prepareInstructions({ jobTitle, jobDescription })
      );

      if (!feedback) {
        setStatusText('Error: Failed to analyze resume');
        return;
      }

      const feedbackText =
        typeof feedback.message?.content === 'string'
          ? feedback.message.content
          : feedback.message?.content?.[0]?.text || '';

      let parsedFeedback;

      try {
        parsedFeedback = JSON.parse(feedbackText);
      } catch {
        setStatusText("Error: Invalid AI response format");
        return;
      }

      data.feedback = parsedFeedback;

      await kv.set(`resume:${uuid}`, JSON.stringify(data));

      setStatusText('Analysis complete, redirecting...');
      navigate(`/resume/${uuid}`);

    } catch (err) {
      console.error("FULL ERROR:", err);
      setStatusText("Something went wrong!");
    } finally {
      setISProcessing(false);
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!file) {
      alert('Please upload a resume file first!');
      return;
    }

    const form = e.currentTarget;
    const formData = new FormData(form);

    const companyName = formData.get('company-name') as string;
    const jobTitle = formData.get('job-title') as string;
    const jobDescription = formData.get('job-description') as string;

    if (!companyName || !jobTitle || !jobDescription) {
      alert("Please fill all fields");
      return;
    }

    handleAnalyze({ companyName, jobTitle, jobDescription, file });
  };

  return (
    <main className="bg-[url('/images/bg-main.svg')] bg-cover min-h-screen">
      <Navbar />

      <section className="main-section">
        <div className="page-heading py-16">
          <h1>Smart feedback for your dream job</h1>

          {isProcessing ? (
            <>
              <h2>{statusText}</h2>
              <img src="/images/resume-scan.gif" className="w-full" />
            </>
          ) : (
            <h2>Drop your resume for an ATS score and improvement tips</h2>
          )}

          {!isProcessing && (
            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-4 mt-8"
            >
              <input name="company-name" placeholder="Company Name" />
              <input name="job-title" placeholder="Job Title" />
              <textarea name="job-description" placeholder="Job Description" />

              <FileUploader onFileSelect={handleFileSelect} />

              <button type="submit">Analyze Resume</button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
};

export default Upload; // ✅ FIXED EXPORT