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
                            className="text-md text-neutral-950 dark:text-neutral-100 font-medium hover:underline"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {item.company}
                        </a>

                        <p className="text-sm text-neutral-500 dark:text-neutral-400">{item.contract} - {item.location}</p>
                    </div>

                    <div className="flex flex-row items-center text-neutral-950 dark:text-neutral-300 text-sm gap-2">
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
                            className="px-1 py-1 border border-gray-200 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-[#2f3031] text-xs text-gray-500 dark:text-white"
                        >
                            {skill}
                        </p>
                        ))}
                    </div>
                    
                    <div className="text-[.82rem] pt-2 text-neutral-500 dark:text-neutral-400 text-justify">
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
