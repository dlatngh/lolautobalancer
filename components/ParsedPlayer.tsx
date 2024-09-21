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
        className={`flex w-full font-beaufort uppercase text-lg items-center`}
      >
        {props.playerName}
      </div>
    </>
  );
}
