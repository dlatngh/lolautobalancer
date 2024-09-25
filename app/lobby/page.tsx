import Divider from "@/components/global/Divider";
import Lobby from "@/components/lobby-setup/Lobby";

export default function LobbySetUp() {
  return (
    <>
      <div className="relative mx-auto flex max-w-3xl flex-col items-center px-6 text-center sm:pt-16 lg:px-0 justify-center">
        <div className="flex flex-col items-center text-5xl font-bold  lg:text-6xl font-beaufort text-[#C89B3C] ">
          <h1 className="uppercase">Confirm Lobby</h1>
        </div>
      </div>
      <Divider />
      <Lobby />
    </>
  );
}
