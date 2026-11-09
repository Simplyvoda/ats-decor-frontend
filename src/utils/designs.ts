import {IDesign} from '../../interface/design.interface';
import {IFurniture} from '../../interface/furniture.interface';
import {IRoom} from '../../interface/room.interface';

// The 3D viewer's params for a new design in a saved room.
export const roomDesignParams = (room: IRoom) => ({
  modelUrl: room.model_url,
  roomId: room.id,
  roomName: room.name,
  roomSource: room.source,
});

// Starts a new design in a saved room.
export const startDesignFromRoom = (navigation: any, room: IRoom) =>
  navigation.navigate('ARViewer', roomDesignParams(room));

// Opens a saved design in the 3D viewer.
export const openDesign = (navigation: any, design: IDesign) =>
  navigation.navigate('ARViewer', {
    modelUrl: design.file_url,
    designId: design.id,
    roomId: design.room_id ?? undefined,
    designName: design.name,
    furnitureLayout: design.furniture_layout,
    designStyle: design.style ?? undefined,
    designTags: design.tags?.map(t => t.name) ?? [],
    designIsPublic: design.is_public,
    exportUnlocked: !!design.export_unlocked_at,
  });

// The design the user worked on most recently.
export const latestDesign = (designs: IDesign[]): IDesign | null =>
  designs.reduce<IDesign | null>(
    (latest, d) =>
      !latest || new Date(d.updatedAt) > new Date(latest.updatedAt)
        ? d
        : latest,
    null,
  );

// A short line about the last thing done in a design, e.g. "Added a sofa".
// We don't keep a history of edits, so this uses the last furniture piece in
// the saved layout, named from the catalogue.
export const describeLastActivity = (
  design: IDesign,
  catalogue: IFurniture[],
): string => {
  const layout = design.furniture_layout ?? [];
  if (layout.length === 0) {
    return 'Saved your room';
  }
  const last = layout[layout.length - 1];
  const piece = catalogue.find(f => f.model_url === last.modelUrl);
  if (!piece) {
    return 'Added furniture';
  }
  const name = piece.name.toLowerCase();
  return `Added ${/^[aeiou]/.test(name) ? 'an' : 'a'} ${name}`;
};

// "Today · 4:30 PM", "Yesterday · 4:30 PM", or "12 Oct · 4:30 PM".
export const formatActivityTime = (iso: string): string => {
  const date = new Date(iso);
  const time = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
  const startOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const daysAgo = Math.round(
    (startOfDay(new Date()) - startOfDay(date)) / (24 * 60 * 60 * 1000),
  );
  const day =
    daysAgo === 0
      ? 'Today'
      : daysAgo === 1
        ? 'Yesterday'
        : date.toLocaleDateString('en-GB', {day: 'numeric', month: 'short'});
  return `${day} · ${time}`;
};
