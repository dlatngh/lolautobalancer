import Divider from "@/components/Divider";
import { placeholder } from "@/lib/utils";

export default function Home() {
  const number = 10;
    
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#010A13] bg-opacity-95">
      <div className="relative mx-auto flex max-w-3xl flex-col items-center px-6 text-center sm:pt-16 lg:px-0 justify-center">
        <div className="flex flex-col items-center text-5xl font-bold  lg:text-6xl font-beaufort text-[#C89B3C] ">
          <h1 className="uppercase">League of Legends</h1>
          <h1 className="uppercase">Autobalancer</h1>
          <p className="mt-5 font-spiegel text-[#A09B8C] font-medium text-md sm:text-lg">
            An autobalancing tool for your League of Legends custom 5v5 lobbies.
          </p>
        </div>
      </div>
      <Divider />
      <div className="flex-col flex items-center justify-center sm:space-y-2">
        <div className="flex flex-row items-center justify-center space-x-10">
          <div className="flex flex-col m-auto sm:space-y-2 w-96 h-96">
            <label
              htmlFor="chatLog"
              className="uppercase font-bold font-beaufort text-[#A09B8C] text-lg"
            >
              Paste Chat Log Here
            </label>
            <textarea
              id="chatLog"
              className="w-full h-full resize-none my-2 text-lg text-[#A09B8C] font-spiegel p-2 outline outline-gradient-to-r from-[#091428] to-[#0A1428] outline-[#C89B3C] bg-gradient-to-r"
              rows={10}
              placeholder={placeholder()}
            ></textarea>
          </div>
          <div className="flex flex-col m-auto sm:space-y-2 w-96 h-96">
            <h1 className="uppercase font-bold font-beaufort text-[#A09B8C] text-lg">
              Players ({number})
            </h1>
            <div className="w-full h-full text-sm text-[#A09B8C] font-spiegel p-2 outline outline-gradient-to-r from-[#091428] to-[#0A1428] outline-[#C89B3C] bg-gradient-to-r"></div>
          </div>
        </div>
        <div className="flex items-center justify-center py-10 pb-16">
          <button
            type="button"
            className="bg-[#1E282D] px-14 py-3 text-2xl font-beaufort uppercase font-bold text-[#C89B3C] outline outline-gradient-to-r outline-[#C89B3C] shadow-sm hover:bg-[#1E2328]"
          >
            Balance
          </button>
        </div>
      </div>
    </div>
  );
}
