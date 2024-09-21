interface ParsedPlayerProps {
  playerName: string;
  i: number;
}
export default function ParsedPlayer(
  props: ParsedPlayerProps
): React.ReactNode {
  return (
    <>
      <div
        className={`flex w-full h-[10%] font-beaufort uppercase text-lg items-center border-[#C89B3C] ${
          props.i !== 9 ? "border-b" : ""
        }`}
      >
        {props.playerName}
      </div>
    </>
  );
}
