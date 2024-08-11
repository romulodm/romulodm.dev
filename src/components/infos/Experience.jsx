import './style.css'
import getInformation from "../../utils/getInformation";

import moment from 'moment';
import { Avatar } from '@mui/material';

export default function Experience() {
  const personalInformations = getInformation();

  return (
    <div className="space-y-6">
      {personalInformations.experience.map((item, index) => {
    
        const isLast = index === personalInformations.experience.length - 1;

        return (
          <div className="flex flex-row w-full gap-1" key={`${item.company}-${index}`}>
                <div className={`relative w-14 ${isLast ? 'timeline-connector-last' : 'timeline-connector'}`}>
                    <Avatar
                        color="neutral"
                        variant="soft"
                        size="2xl"
                        className="border rounded-md w-12 h-12"
                        src={item.icon}
                    />
                </div>

                <div className="flex flex-col">
                    <div className="flex flex-rol gap-1 items-center">
                        <a
                            href={item.url}
                            className="text-md font-medium hover:underline"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {item.company}
                        </a>

                        <p className="text-sm text-gray-500">{item.contract} - {item.location}</p>
                    </div>

                    <div className="flex flex-row items-center text-sm gap-2">
                        <p>
                            {item.position}
                        </p>

                        <p>
                            |
                        </p>  

                        <p>
                            {item.start} - {item.end}
                        </p> 

                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                        {item.skills.map((skill, skillIndex) => (
                        <p
                            key={skillIndex}
                            className="px-1 py-1 border border-gray-200 rounded-md bg-gray-50 text-xs text-gray-500"
                        >
                            {skill}
                        </p>
                        ))}
                    </div>
                    
                    <div className="text-[.82rem] pt-2 text-neutral-500 text-justify">
                        <div>
                            {item.about}
                        </div>
                        {Array.isArray(item.description) ? (
                            <div className="list-disc list-inside">
                                {item.description.map((desc, descIndex) => (
                                <div key={descIndex}> {descIndex + 1} - {desc}</div>
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
