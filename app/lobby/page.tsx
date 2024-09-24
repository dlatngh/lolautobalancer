import Divider from "@/components/Divider";
import Lobby from "@/components/Lobby";

export default function PreBalance() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#010A13] bg-opacity-95">
      <div className="relative mx-auto flex max-w-3xl flex-col items-center px-6 text-center sm:pt-16 lg:px-0 justify-center">
        <div className="flex flex-col items-center text-5xl font-bold  lg:text-6xl font-beaufort text-[#C89B3C] ">
          <h1 className="uppercase">Confirm Lobby</h1>
        </div>
      </div>
      <Divider />
      <Lobby />
    </div>
  );
}
