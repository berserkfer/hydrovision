import { SearchInput } from "@/components/ui/SearchInput";

interface StationSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export function StationSearch({ value, onChange }: StationSearchProps) {
  return (
    <SearchInput
      id="station-search"
      value={value}
      onChange={onChange}
      placeholder="Buscar por código, nombre, río, cuenca…"
      className="min-w-[240px] flex-1"
    />
  );
}
