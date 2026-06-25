import Divider from "@/components/ui/Divider";
import Lobby from "@/components/lobby-setup/Lobby";

export default function LobbySetUp() {
  return (
    <>
      <div className="relative mx-auto flex max-w-3xl flex-col items-center px-6 text-center sm:pt-16 lg:px-0 justify-center">
        <div className="flex flex-col items-center text-5xl font-bold  lg:text-6xl font-beaufort text-[#C89B3C] ">
          <h1 className="uppercase">Confirm Lobby</h1>
          <p className="mt-5 font-spiegel text-[#A09B8C] font-medium text-md sm:text-lg">
            Confirm and adjust the information of each player here. We can only
            fetch the peak rank of the current split. Summoner Level is only
            acconted for if player is unranked.
          </p>
          <p className="mt-5 font-spiegel text-[#A09B8C] font-medium text-md sm:text-lg">
            Note: These are not the balanced teams yet.
          </p>
        </div>
      </div>
      <Divider />
      <Lobby />
    </>
  );
}
