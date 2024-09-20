import Divider from "@/components/Divider";

export default function Home() {
  const number = 10;
  function placeholder(): string {
    var placeHolder: string = "";
    const limit = 13;
    for (var i = 0; i < limit; i++) {
      if (i != limit - 1) placeHolder += "GameName#Tag has joined the lobby\n";
      else placeHolder += "GameName#Tag has joined the lobby";
    }
    return placeHolder;
  }
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#010A13] bg-opacity-95">
      <div className="relative mx-auto flex max-w-3xl flex-col items-center px-6 text-center sm:py-10 lg:px-0 justify-center">
        <div className="flex flex-col items-center">
          <h1 className="text-4xl font-bold tracking-tight lg:text-6xl font-beaufort uppercase text-[#C89B3C]">
            League of Legends Autobalancer
          </h1>
          <p className="mt-4 font-spiegel text-[#A09B8C] font-medium text-md">
            An autobalancing tool for your League of Legends custom 5v5 lobbies.
          </p>
        </div>
      </div>
      <Divider />
      <div className="flex-col flex  items-center justify-center sm:space-y-2">
        <div className="flex flex-row  items-center justify-center space-x-10 sm:py-10">
          <div className="flex flex-col m-auto sm:space-y-2 w-96">
            <label
              htmlFor="chatLog"
              className="uppercase font-bold font-beaufort text-[#A09B8C]"
            >
              Chat Log
            </label>
            <textarea
              id="chatLog"
              className="w-full my-2 text-sm text-[#A09B8C] font-spiegel p-2 outline outline-gradient-to-r from-[#091428] to-[#0A1428] outline-[#C89B3C] bg-gradient-to-r"
              rows={10}
              placeholder={placeholder()}
            ></textarea>
          </div>
          <div className="flex flex-col m-auto sm:space-y-2   w-96">
            <h1 className="uppercase font-bold font-beaufort text-[#A09B8C]">
              Players ({number})
            </h1>
            <textarea
              id="chatLog"
              className="w-full text-sm text-[#A09B8C] font-spiegel p-2 outline outline-gradient-to-r from-[#091428] to-[#0A1428] outline-[#C89B3C] bg-gradient-to-r"
              rows={10}
            ></textarea>
          </div>
        </div>
        <div className="flex  items-center justify-center">
          <button
            type="button"
            className="bg-[#1E282D] px-14 py-3 text-xl font-beaufort uppercase font-bold text-[#C89B3C] outline outline-gradient-to-r outline-[#C89B3C] shadow-sm hover:bg-[#1E2328]"
          >
            balance
          </button>
        </div>
      </div>
    </div>
  );
}
