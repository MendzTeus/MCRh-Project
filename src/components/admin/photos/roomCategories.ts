// Room names used to group apartment photos (Photo Tour on the public site).
// Stored values stay in English — they are shown to guests.
export type RoomCounts = {
  bedrooms?: number | null;
  bathrooms?: number | null;
  ensuiteBathrooms?: number | null;
  wcCount?: number | null;
};

export function suggestedRooms(unit: RoomCounts): string[] {
  const bedrooms = unit.bedrooms ?? 2;
  const bathrooms = unit.bathrooms ?? 1;
  const ensuite = unit.ensuiteBathrooms || 0;
  const wc = unit.wcCount || 0;
  const rooms = ['Living room', 'Kitchen', 'Dining area'];
  for (let i = 1; i <= bedrooms; i++) rooms.push(bedrooms === 1 ? 'Bedroom' : `Bedroom ${i}`);
  if (bathrooms <= 1) rooms.push('Bathroom');
  else for (let i = 1; i <= bathrooms; i++) rooms.push(`Bathroom ${i}`);
  if (ensuite === 1) rooms.push('Ensuite bathroom');
  else for (let i = 1; i <= ensuite; i++) rooms.push(`Ensuite bathroom ${i}`);
  if (wc === 1) rooms.push('WC');
  else for (let i = 1; i <= wc; i++) rooms.push(`WC ${i}`);
  rooms.push('Balcony', 'Workspace', 'Entrance', 'Exterior', 'Building', 'Other');
  return rooms;
}

// Portuguese labels for the admin only (value stays the English room name).
const PT: Record<string, string> = {
  'Living room': 'Sala', Kitchen: 'Cozinha', 'Full kitchen': 'Cozinha', 'Dining area': 'Sala de jantar',
  Bedroom: 'Quarto', Bathroom: 'Banheiro', 'Full bathroom': 'Banheiro', 'Ensuite bathroom': 'Banheiro da suíte',
  WC: 'Lavabo', Balcony: 'Varanda', Terrace: 'Terraço', Workspace: 'Área de trabalho', Entrance: 'Entrada',
  Hallway: 'Corredor', Exterior: 'Área externa', Building: 'Prédio', 'Shared areas': 'Áreas comuns', Other: 'Outros',
};

export function roomLabel(room: string): string {
  if (!room) return 'Sem cômodo';
  if (PT[room]) return PT[room];
  const numbered = room.match(/^(.*?) (\d+)$/);
  if (numbered && PT[numbered[1]]) return `${PT[numbered[1]]} ${numbered[2]}`;
  return room;
}
