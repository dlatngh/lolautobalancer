import Link from "next/link";
import Divider from "@/components/ui/Divider";
import PlayerBox from "@/components/PlayerBox";

export default function Home() {
  return (
    <>
      <div className="relative mx-auto flex max-w-3xl flex-col items-center px-6 text-center sm:pt-16 lg:px-0 justify-center">
        <div className="flex flex-col items-center text-5xl font-bold lg:text-6xl font-beaufort text-[#C89B3C]">
          <h1 className="uppercase">League of Legends</h1>
          <h1 className="uppercase">Autobalancer</h1>
          <p className="mt-5 font-spiegel text-[#A09B8C] font-medium text-md sm:text-lg">
            An autobalancing tool for your League of Legends custom 5v5 lobbies.
          </p>
        </div>
      </div>
      <Divider />
      <PlayerBox />
      <Divider />
      <div className="flex flex-col items-center pb-16 space-y-4">
        <p className="font-beaufort uppercase text-[#A09B8C] text-sm tracking-widest">
          Also available
        </p>
        <Link href="/role-balance">
          <div className="border-black border-4 outline outline-gradient-to-r outline-[#C89B3C]">
            <div className="bg-[#1E282D] px-12 py-3 text-2xl font-beaufort uppercase font-bold text-[#C8AA6E] hover:bg-[#1E2328]">
              Role Balance (beta)
            </div>
          </div>
        </Link>
      </div>
    </>
  );
}
