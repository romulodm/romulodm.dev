import getInformation from "../../utils/getInformation";

export default function Education() {
  const personalInformations = getInformation();

  return (
    <div className="space-y-3 w-full">
      {personalInformations.education.map((item, index) => {
        const isLast = index === personalInformations.education.length - 1;

        return (
          <div className="flex flex-row w-full gap-2 items-center" key={`${item.school}-${index}`}>
            <div className="relative w-14">
              <img
                alt={item.school}
                className="responsive-img w-12 h-12 rounded-lg border border-gray-300"
                src={item.icon}
              />
            </div>
            <div className="flex flex-col">
              <div className="flex flex-row gap-2 items-center">
                <a
                  href={item.url}
                  className="text-lg font-medium hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {item.school}
                </a>
                <p className="text-sm text-gray-500">{item.start} - {item.end}</p>
              </div>
              <div className="flex flex-row items-center gap-2">
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
