import {useState, type FormEvent} from 'react'
import { useNavigate } from 'react-router'
import FileUploader from '~/components/FileUploader';
import Navbar from '~/components/Navbar'
import { usePuterStore } from '~/lib/puter';
import { convertPdfToImage } from '~/lib/pdf2img';
import { generateUUID } from '~/lib/utils';
import { prepareInstructions, AIResponseFormat } from '~/constants';

const upload = () => {
  const {auth,isLoading ,fs,ai,kv}  = usePuterStore();
  const navigate = useNavigate();
  const [isProcessing,setISProcessing] = useState(false);
  const [statusText,setStatusText] = useState<string>();
  const [file,setFile] = useState<File | null>(null)


  const handleFileSelect = (file: File | null) => {
    setFile(file)
  }

  const handleAnalyze = async({file,companyName,jobTitle,jobDescription}:{companyName:string,jobTitle:string,jobDescription:string,file:File}) => {
    setISProcessing(true);
    setStatusText('Uploading the file...');
    const uploadedFile = await fs.upload([file]);

    if(!uploadedFile) return setStatusText('Error:Failed to upload file');
    setStatusText('Converting to image...');
    const imageFile = await convertPdfToImage(file);
    if(!imageFile.file) {
      const errorMsg = imageFile.error || 'Failed to convert PDF to image';
      console.error('PDF conversion failed:', errorMsg);
      return setStatusText(`Error: ${errorMsg}`);
    }

    setStatusText('Uploading the image...');
    const uploadedImage = await fs.upload([imageFile.file]);
    if(!uploadedImage) return setStatusText('Failed to upload image');

    setStatusText('Preparing Data');

    const uuid = generateUUID();
    const data = {
       id:uuid,
       resumePath:uploadedFile.path,
       imagePath:uploadedImage.path,
       companyName,
       jobTitle,
       jobDescription,
       feedback:'',

    }

    await kv.set(`resume:${uuid}`, JSON.stringify(data));
    setStatusText('Analyzing...');

    const feedback = await ai.feedback(
      uploadedFile.path,
      prepareInstructions({jobTitle, jobDescription})
    )
    if(!feedback) return setStatusText('Error:Failed to analyze resume');

    const feedbackText = typeof feedback.message.content === 'string' ?  feedback.message.content : feedback.message.content[0].text;
    data.feedback = JSON.parse(feedbackText);
    await kv.set(`resume:${uuid}`, JSON.stringify(data));
    setStatusText('Analysis complete, redirecting...');
    
    // Navigate to results page after successful analysis
    navigate(`/resume/${uuid}`);
  }
  const handleSubmit = (e:FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validate if file is selected
    if (!file) {
      alert('Please upload a resume file first!');
      return;
    }
    
    const form = e.currentTarget;
    const formData = new FormData(form);

    const companyName = formData.get('company-name') as string
    const jobTitle = formData.get('job-title') as string
    const jobDescription = formData.get('job-description') as string

    // Add file to form data
    formData.append('resume', file);

    if(!file) return;

    handleAnalyze({companyName,jobTitle,jobDescription,file});
  }
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
            
          ):(
            <h2>Drop your resume for an ATS score and improvement tips</h2>
          )}

          {!isProcessing && (
            <form id="upload-form" onSubmit={handleSubmit} className="flex flex-col gap-4 mt-8">

                <div className="form-div">
                    <label htmlFor="company-name">Company Name </label>
                    <input type="text" name="company-name" placeholder="Company Name" id="Company Name"></input>
                </div>

                <div className="form-div">
                    <label htmlFor="job-title">Job Title </label>
                    <input type="text" name="job-title" placeholder="job-title" id="job-title"></input>
                </div>

                <div className="form-div">
                    <label htmlFor="job-description">Job Description </label>
                    <textarea rows={5} name="job-description" placeholder="Job Description" id="job-description"></textarea>
                </div>

                <div className="form-div">
                    <label htmlFor="uploader"> Upload Resume </label>
                    <FileUploader onFileSelect={handleFileSelect} />
                </div>

                <button className="primary-button" type="submit">
                    Analyze Resume
                </button>

            </form>
          )}
        </div>
    </section>
    </main>
  )
}

export default upload
