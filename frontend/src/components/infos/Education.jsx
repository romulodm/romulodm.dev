import { Avatar } from "@mui/material";
import getInformation from "../../utils/getInformation";

export default function Education() {
  const personalInformations = getInformation();

  return (
    <div className="space-y-3 w-full">
      {personalInformations.education.map((item, index) => {
        const isLast = index === personalInformations.education.length - 1;

        return (
          <div className="flex flex-row w-full gap-3 items-center" key={`${item.school}-${index}`}>
            <div className="w-[3rem]">
              <Avatar
                color="neutral"
                variant="soft"
                size="2xl"
                className="border rounded-md w-12 h-12"
                src={item.icon}
              />
            </div>
            <div className="flex flex-col">
              <div className="flex flex-row gap-2 items-center">
                <a
                  href={item.url}
                  className="text-md text-neutral-950 dark:text-neutral-100 font-medium hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {item.school}
                </a>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">{item.start} - {item.end}</p>
              </div>
              <div className="flex text-neutral-500 dark:text-neutral-400 flex-row items-center gap-2">
                <p>{item.degree}</p>
                <p>|</p>
                <p>{item.major}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
