import { useTranslation } from "react-i18next";
import getInformation from "../../utils/getInformation";

export default function Initial() {
    const personalInformations = getInformation();
    const { t } = useTranslation('resume');

    return (
        <div className="flex flex-col w-full">
            <div className="py-4">
                <h1 className="text-4xl text-gray-950 dark:text-neutral-200 font-extrabold">{personalInformations.infos.name}</h1>
                <div className="text-lg font-semibold text-gray-700 dark:text-neutral-400 ">{personalInformations.infos.position}</div>
                <p className="text-sm pt-2 pb-2.5 text-justify text-neutral-500 dark:text-neutral-400">{personalInformations.infos.bio}</p>
                <div className="text-sm grid grid-cols-2 lg:grid-cols-4 gap-1">
                    <div>
                        <h3 className="font-bold text-neutral-500 dark:text-neutral-400">Endereço:</h3>
                        <p className="text-neutral-500 dark:text-neutral-400">{personalInformations.contact.address}</p>
                    </div>
                    <div>
                        <h3 className="font-bold text-neutral-500 dark:text-neutral-400">Email:</h3>
                        <p><a className="text-neutral-500 dark:text-neutral-400 hover:underline" href={`mailto:${personalInformations.contact.email}`}>{personalInformations.contact.email}</a></p>
                    </div>
                    <div>
                        <h3 className="font-bold text-neutral-500 dark:text-neutral-400">LinkedIn:</h3>
                        <p><a className="underline text-blue-500 dark:text-sky-500" href={personalInformations.contact.linkedin} target="_blank" rel="noopener noreferrer">{t("linkedin")}</a></p>
                    </div>
                    <div>
                        <h3 className="font-bold text-neutral-500 dark:text-neutral-400">GitHub:</h3>
                        <p><a className="underline text-blue-500 dark:text-sky-500" href={personalInformations.contact.github} target="_blank" rel="noopener noreferrer">{t("github")}</a></p>
                    </div>
                </div>
            </div>
        </div>
    );
}
