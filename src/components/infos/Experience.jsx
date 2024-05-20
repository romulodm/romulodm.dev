import './style.css'
import getInformation from "../../utils/getInformation";

import moment from 'moment';

export default function Experience() {
  const personalInformations = getInformation();

  return (
    <div className="space-y-6">
      {personalInformations.experience.map((item, index) => {
        
        const startDate = moment(item.start, 'MMM YYYY').toDate();
        const endDate = moment(item.end === 'Present' ? new Date(Date.now()) : item.end, 'MMM YYYY').toDate();
        const duration = moment(endDate).from(startDate, true);

        const isLast = index === personalInformations.experience.length - 1;

        return (
          <div className="flex flex-row w-full gap-2" key={`${item.company}-${index}`}>
                <div className={`relative w-14 ${isLast ? 'timeline-connector-last' : 'timeline-connector'}`}>
                    <img
                        alt={item.company}
                        className="responsive-img w-12 h-12 rounded-lg border border-gray-300"
                        src={item.icon}
                    />
                </div>

                <div className="flex flex-col">
                    <div className="flex flex-rol gap-2 items-center">
                        <a
                            href={item.url}
                            className="text-lg font-medium hover:underline"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {item.company}
                        </a>

                        <p className="text-sm text-gray-500">{item.contract} - {item.location}</p>
                    </div>

                    <div className="flex flex-row items-center gap-2">
                        <p>
                            {item.position}
                        </p>

                        <p>
                            |
                        </p>  

                        <p>
                            {item.start} - {item.end} ({duration}) 
                        </p> 

                    </div>

                    <div className="flex flex-wrap gap-2 py-2">
                        {item.skills.map((skill, skillIndex) => (
                        <p
                            key={skillIndex}
                            className="px-2 py-1 border border-gray-300 rounded text-sm"
                        >
                            {skill}
                        </p>
                        ))}
                    </div>

                    <div className="text-sm text-gray-500">
                        {Array.isArray(item.description) ? (
                        <div className="list-disc list-inside">
                            {item.description.map((desc, descIndex) => (
                            <div key={descIndex}>- {desc}</div>
                            ))}
                        </div>
                        ) : (
                        <p>{item.description}</p>
                        )}
                    </div>
                    
                </div>
        </div>
            

        );
      })}
    </div>
  );
}
