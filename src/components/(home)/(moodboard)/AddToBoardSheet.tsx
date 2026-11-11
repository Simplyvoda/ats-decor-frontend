// "Add to a board" for one design, from anywhere (e.g. right after saving
// it in Explore). Loads the boards itself, ticks the ones the design is
// on, and can make a new board for it.
import React, {useEffect, useRef, useState} from 'react';
import Toast from 'react-native-toast-message';
import MoodboardService from '../../../services/MoodboardService';
import {IMoodboardSummary} from '../../../../interface/design.interface';
import {usePlan} from '../../../context/PlanContext';
import useAfterModalClose from '../../../hooks/useAfterModalClose';
import {BoardNameModal, ChecklistSheet} from './BoardParts';

const errorText = (err: any) =>
  err?.response?.data?.message || err?.message || 'Please try again';

export default function AddToBoardSheet({
  design,
  onClose,
}: {
  // The design to place; null = closed
  design: {id: string; name: string} | null;
  onClose: () => void;
}) {
  const {gate} = usePlan();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [naming, setNaming] = useState(false);
  const [boards, setBoards] = useState<IMoodboardSummary[] | null>(null);
  const [onBoards, setOnBoards] = useState<string[]>([]);
  const afterSheet = useAfterModalClose();
  // Which design the loaded data belongs to (ignores late answers)
  const loadedFor = useRef<string | null>(null);

  const designId = design?.id ?? null;
  useEffect(() => {
    if (!designId) {
      return;
    }
    setSheetOpen(true);
    setBoards(null);
    setOnBoards([]);
    loadedFor.current = designId;
    Promise.all([MoodboardService.getBoards(), MoodboardService.getMoodboard()])
      .then(([list, saved]) => {
        if (loadedFor.current !== designId) {
          return;
        }
        setBoards(
          [...list].sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
        );
        setOnBoards(
          saved.data.find(i => i.design_id === designId)?.board_ids ?? [],
        );
      })
      .catch(err => {
        setSheetOpen(false);
        onClose();
        Toast.show({
          type: 'error',
          text1: 'Could not load your boards',
          text2: errorText(err),
        });
      });
    // onClose is a fresh function each render; only the design matters
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [designId]);

  const toggle = async (boardId: string, on: boolean) => {
    if (!design) {
      return;
    }
    const before = onBoards;
    setOnBoards(on ? [...before, boardId] : before.filter(b => b !== boardId));
    try {
      if (on) {
        await MoodboardService.addToBoard(boardId, design.id);
      } else {
        await MoodboardService.removeFromBoard(boardId, design.id);
      }
    } catch (err: any) {
      setOnBoards(before);
      Toast.show({
        type: 'error',
        text1: 'Could not update the board',
        text2: errorText(err),
      });
    }
  };

  const close = () => {
    setSheetOpen(false);
    onClose();
  };

  const startNewBoard = () => {
    setSheetOpen(false);
    // Open the name dialog (or the upgrade sheet) once the sheet has gone
    afterSheet.run(() => {
      if (gate('moodboard.active')) {
        setNaming(true);
      } else {
        onClose();
      }
    });
  };

  const createBoard = async (name: string) => {
    setNaming(false);
    const target = design;
    onClose();
    if (!target) {
      return;
    }
    try {
      const board = await MoodboardService.createBoard(name);
      await MoodboardService.addToBoard(board.id, target.id);
      Toast.show({type: 'success', text1: `Added to “${board.name}”`});
    } catch (err: any) {
      // Over the plan's limit, the upgrade sheet opens by itself.
      if (err?.response?.data?.code !== 'PLAN_LIMIT_REACHED') {
        Toast.show({
          type: 'error',
          text1: 'Could not create the board',
          text2: errorText(err),
        });
      }
    }
  };

  return (
    <>
      <ChecklistSheet
        visible={sheetOpen}
        title="Add to a board"
        subtitle={design?.name}
        loading={boards === null}
        emptyText="You don’t have any boards yet. Make one to group your saved designs."
        rows={(boards ?? []).map(b => ({
          id: b.id,
          title: b.name,
          subtitle: `${b.item_count} design${b.item_count === 1 ? '' : 's'}`,
          checked: onBoards.includes(b.id),
        }))}
        footer={{label: 'New board', onPress: startNewBoard}}
        onToggle={row => toggle(row.id, !row.checked)}
        onClose={close}
        onDismiss={afterSheet.onDismiss}
      />
      <BoardNameModal
        visible={naming}
        title="New board"
        saveLabel="Create"
        onClose={() => {
          setNaming(false);
          onClose();
        }}
        onSave={createBoard}
      />
    </>
  );
}
