import Divider from "@/components/Divider";
import PlayerBox from "@/components/PlayerBox";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#010A13] bg-opacity-95">
      <div className="relative mx-auto flex max-w-3xl flex-col items-center px-6 text-center sm:pt-16 lg:px-0 justify-center">
        <div className="flex flex-col items-center text-5xl font-bold lg:text-6xl font-beaufort text-[#C89B3C] ">
          <h1 className="uppercase">League of Legends</h1>
          <h1 className="uppercase">Autobalancer</h1>
          <p className="mt-5 font-spiegel text-[#A09B8C] font-medium text-md sm:text-lg">
            An autobalancing tool for your League of Legends custom 5v5 lobbies.
          </p>
        </div>
      </div>
      <Divider />
      <PlayerBox />

      <div className="flex items-center justify-center py-10 pb-16 ">
        <div className="border-black border-4 outline outline-gradient-to-r outline-[#C89B3C] ">
          <button
            type="button"
            className="bg-[#1E282D] px-14 py-3 text-2xl font-beaufort uppercase font-bold text-[#C8AA6E] hover:bg-[#1E2328]"
          >
            Balance
          </button>
        </div>
      </div>
    </div>
  );
}
