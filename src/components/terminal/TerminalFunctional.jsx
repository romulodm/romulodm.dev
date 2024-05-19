export default function TerminalFunctional({ componentsToShow, textTypedByUser, setTextTypedByUser, checkMessageEntered }) {
  return (
      <div className="flex flex-col">
          {componentsToShow.map((Component, index) => (
              <Component key={index} />
          ))}

          <div className="font-mono text-sm">
              <div className="flex items-center flex-nowrap gap-1">
                  <div className="text-blue-600 font-semibold">visitor@romulodm:~$&nbsp;</div>
                  <input
                      className="whitespace-nowrap outline-0 border-0 font-semibold flex-1"
                      value={textTypedByUser}
                      onChange={(e) => setTextTypedByUser(e.target.value)}
                      onKeyDown={checkMessageEntered}
                  />
              </div>
          </div>
      </div>
  );
}