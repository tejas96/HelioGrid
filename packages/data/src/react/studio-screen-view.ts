import type {
  FocusParts,
  GroundBox,
  MeasurementSystem,
  PictureChoice,
  StairsMoment,
  StepPlace,
  StudioDocument,
  StudioView,
  SunPosition,
  ViewPlace,
} from '@heliogrid/domain';
import type { RoofModelShown } from './roof-model-shown';
import type { RoofSheetRowMoves, RoofSheetRowsState } from './roof-sheet-rows-view';
import type { RoofMoves, RoofPlaceMoves, RoofStepView } from './roof-step-view';
import type { RoofsPanelMoves, RoofsPanelView } from './roofs-panel-view';
import type { SkyFacts, StudioEditing, StudioPicture } from './studio-document-state';
import type { StudioSaveState } from './studio-save-queue';
import type { DesignRead } from './use-design-screen';
import type { OwnPictureMoves, OwnPictureView } from './use-own-picture-screen';
import type { RoofSheetMoves, RoofSheetState } from './use-roof-sheet';
import type { StairsMoves, StairsView } from './use-studio-stairs';

/** The studio screen's view model (`T-M05-002`): what its hook assembles for the web and the phone. */

export interface StudioMoves
  extends RoofMoves,
    RoofSheetMoves,
    RoofSheetRowMoves,
    RoofPlaceMoves,
    RoofsPanelMoves,
    StairsMoves {
  pickPicture(choice: PictureChoice): void;
  /**
   * Draw an Any-shape roof's faces by hand, from its Faces row: in the top view, the next face; a
   * roof standing in its faces has them drawn again.
   */
  drawFaces(roof: number): void;
  undo(): void;
  redo(): void;
  chooseUnits(system: MeasurementSystem): void;
  /** After someone saved first: the design as they left it, read again. */
  openTheirs(): void;
  /** A change that waits, sent now. */
  retry(): void;
  /** The "Picture updated · check the outline" note, seen. */
  pictureChecked(): void;
  /** The camera's view of the model: the top, the 3D view or a side. */
  see(view: StudioView): void;
  /** The three pictures shown or put away. */
  showPictures(open: boolean): void;
  /** The View panel (the views, metres or feet) shown or put away. */
  showView(open: boolean): void;
  /** The phone's system back (`studioBack`): `false` with nothing open to close. */
  back(): boolean;
}

export interface StudioScreen
  extends RoofStepView,
    RoofSheetState,
    RoofSheetRowsState,
    RoofModelShown,
    RoofsPanelView,
    StairsView {
  readonly read: DesignRead;
  /** `null` until the document is read. */
  readonly document: StudioDocument | null;
  readonly picture: StudioPicture;
  readonly own: OwnPictureView; // Your picture and the plan (`T-M05-002d`).
  /** The picture the roofs were drawn on is newer now, and the note is not seen yet (board 5.1). */
  readonly pictureUpdated: boolean;
  /** The sky picture's sharpness and date, shown or not; `null` while unread or where none. */
  readonly skyFacts: SkyFacts | null;
  readonly editing: StudioEditing;
  readonly saving: StudioSaveState;
  /** A change waits, not sent: no connection, or the api did not save it. Leaving loses it. */
  readonly unsent: boolean;
  readonly units: MeasurementSystem;
  readonly rail: readonly StepPlace[];
  readonly canUndo: boolean;
  readonly canRedo: boolean;
  /** How the model is seen now; the studio opens on the flat top view. */
  readonly view: StudioView;
  /** The views on offer, each open or waiting with its reason. */
  readonly views: readonly ViewPlace[];
  /** The three pictures are open to pick from. */
  readonly picturesOpen: boolean;
  /** The View panel is open. */
  readonly viewOpen: boolean;
  /** The sun the scene is lit by: the real sun for the site now, or its noon after dark. */
  readonly sun: SunPosition | null;
  /** The ground the design's roofs cover, which the camera frames; `null` before a roof. */
  readonly fit: GroundBox | null;
  /** An arrow on the model is held: the sheet steps aside for the magnet's pill. */
  readonly arrowHeld: boolean;
  /** What the bar says about the stairs when it has nothing else to say; `null` for nothing. */
  readonly stairsMoment: StairsMoment | null;
  /** The 3D switch is marked new until the 3D view is first seen. */
  readonly offer3d: boolean;
  /** Which parts show for the job in hand, on a phone-width screen or a wider one (focus mode). */
  focus(phone: boolean): FocusParts;
  readonly moves: StudioMoves;
  readonly ownMoves: OwnPictureMoves;
}
