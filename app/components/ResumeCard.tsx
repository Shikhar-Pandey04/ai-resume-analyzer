import { Link } from "react-router";
import ScoreCircle from "./scoreCircle";

// Props type
interface ResumeCardProps {
  resume: Resume;
}

const ResumeCard = ({ resume }: ResumeCardProps) => {
  const { id, companyName, jobTitle, feedback, imagePath } = resume;

  return (
    <Link
      to={`/resume/${id}`}
      className="resume-card animate-in fade-in duration-1000"
    >
      <div className="resume-card-header flex justify-between items-center">
        <div className="flex flex-col gap-2">
          <h2 className="!text-black font-bold break-words">{companyName}</h2>
          <h3 className="text-lg break-words text-gray-500">{jobTitle}</h3>
        </div>

        <div className="flex-shrink-0">
          {/* Safe access to feedback */}
          <ScoreCircle score={feedback?.overallScore ?? 0} />
        </div>
      </div> 

      <div className="gradient-border animate-in fade-in duration-1000 mt-3">
        <div className="w-full h-full">
          <img
            src={imagePath}
            alt="resume"
            className="w-full h-[350px] max-sm:h-[250px] object-cover object-top"
          />
        </div>
      </div>
    </Link>
  );
};

export default ResumeCard;
