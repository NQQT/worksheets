// WorksheetPicker tests — the accessible searchable/autosuggest dropdown (R2).
//
// Pinned here:
//   1. the closed input mirrors the selected worksheet's label;
//   2. focusing opens the dropdown listing every plugin (registration order);
//   3. typing filters case-insensitively over label AND registry id;
//   4. a no-match query renders one disabled option (the listbox is never
//      empty);
//   5. clicking an option selects it (store.active) and closes the dropdown;
//   6. keyboard: ArrowDown/ArrowUp move the highlight, Enter selects the
//      highlighted option (or the FIRST MATCH with no highlight), Escape
//      closes without changing the selection;
//   7. CLOSED-STATE TYPING (T6): a printable key while closed RESTARTS the
//      query with just that key — it never appends to the selected label
//      ("Additionfrac");
//   8. the combobox ARIA wiring (role, aria-expanded, aria-controls,
//      aria-autocomplete, aria-haspopup) and aria-activedescendant tracking
//      the highlighted option id, cleared on query changes and close;
//   9. the disabled state for a subject without worksheets.

import React from 'react';
import { fireEvent, render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import { DashboardContextProvider, definePlugin, useDashboardStore, WorksheetPicker, PICKER_LIST_ID, type DashboardPlugin } from './index';

afterEach(cleanup);

// Throwaway plugins shaped like real worksheet plugins (one entry each).
function makePlugin(id: string, label: string, icon = '*'): DashboardPlugin {
    return definePlugin({
        id,
        name: `Test ${id}`,
        subject: 'math',
        entries: [{ id, label, icon, ariaLabel: label }],
        page: () => <div data-testid={`${id}-page`} />
    });
}

const FRACTIONS = makePlugin('fractions', 'Fractions', '½');
const ADDITION = makePlugin('addition', 'Addition', '+');
const CALCULUS = makePlugin('calculus', 'Calculus', '∂');

// Harness with a store probe so the tests can read the selection directly.
let probeStore: ReturnType<typeof useDashboardStore> | null = null;
function StoreProbe() {
    probeStore = useDashboardStore();
    return null;
}

function PickerHarness({ plugins, disabled }: { plugins: DashboardPlugin[]; disabled?: boolean }) {
    return (
        <DashboardContextProvider>
            <StoreProbe />
            <WorksheetPicker plugins={plugins} disabled={disabled} />
        </DashboardContextProvider>
    );
}

describe('WorksheetPicker — closed state', () => {
    it('mirrors the selected (first) worksheet label and stays collapsed', () => {
        render(<PickerHarness plugins={[ADDITION, FRACTIONS]} />);
        const input = screen.getByTestId('worksheet-picker-input') as HTMLInputElement;
        expect(input.value).toBe('Addition');
        expect(input.getAttribute('aria-expanded')).toBe('false');
        expect(screen.queryByTestId('worksheet-picker-list')).toBeNull();
    });

    it('carries the combobox ARIA wiring', () => {
        render(<PickerHarness plugins={[ADDITION]} />);
        const input = screen.getByRole('combobox');
        expect(input.getAttribute('aria-controls')).toBe(PICKER_LIST_ID);
        expect(input.getAttribute('aria-autocomplete')).toBe('list');
        expect(input.getAttribute('aria-haspopup')).toBe('listbox');
        expect(input.getAttribute('aria-label')).toBe('Worksheet');
        // No highlighted option yet: the activedescendant is absent.
        expect(input.getAttribute('aria-activedescendant')).toBeNull();
    });
});

describe('WorksheetPicker — search and autosuggest', () => {
    it('opens on focus listing every plugin in registration order', () => {
        render(<PickerHarness plugins={[ADDITION, FRACTIONS, CALCULUS]} />);
        fireEvent.focus(screen.getByTestId('worksheet-picker-input'));
        const list = screen.getByTestId('worksheet-picker-list');
        expect(list.getAttribute('role')).toBe('listbox');
        const labels = Array.from(list.querySelectorAll('[role="option"]')).map((o) => o.textContent);
        expect(labels).toEqual(['+Addition', '½Fractions', '∂Calculus']);
    });

    it('filters case-insensitively over label and registry id', () => {
        render(<PickerHarness plugins={[ADDITION, FRACTIONS, CALCULUS]} />);
        const input = screen.getByTestId('worksheet-picker-input');
        fireEvent.focus(input);
        fireEvent.change(input, { target: { value: 'FRAC' } });
        const options = screen.getByTestId('worksheet-picker-list').querySelectorAll('[role="option"]');
        expect(options).toHaveLength(1);
        expect(options[0].textContent).toBe('½Fractions');
        expect(options[0].getAttribute('data-testid')).toBe('worksheet-picker-option-fractions');

        // The registry id matches too ("calc" → Calculus via id).
        fireEvent.change(input, { target: { value: 'calc' } });
        expect(screen.getByTestId('worksheet-picker-list').querySelectorAll('[role="option"]')).toHaveLength(1);
        expect(screen.getByTestId('worksheet-picker-option-calculus').textContent).toBe('∂Calculus');
    });

    it('renders one disabled option for a no-match query (never an empty listbox)', () => {
        render(<PickerHarness plugins={[ADDITION]} />);
        const input = screen.getByTestId('worksheet-picker-input');
        fireEvent.focus(input);
        fireEvent.change(input, { target: { value: 'zzz' } });
        const empty = screen.getByTestId('worksheet-picker-empty');
        expect(empty.getAttribute('role')).toBe('option');
        expect(empty.getAttribute('aria-disabled')).toBe('true');
        expect(empty.textContent).toBe('No matching worksheets');
    });
});

describe('WorksheetPicker — selection', () => {
    it('clicking an option selects it in the store and closes the dropdown', () => {
        render(<PickerHarness plugins={[ADDITION, FRACTIONS]} />);
        const input = screen.getByTestId('worksheet-picker-input');
        fireEvent.focus(input);
        fireEvent.click(screen.getByTestId('worksheet-picker-option-fractions'));
        expect(probeStore!.active).toEqual({ pluginId: 'fractions', entryId: 'fractions' });
        // Closed again, and the input now mirrors the NEW selection.
        expect(screen.queryByTestId('worksheet-picker-list')).toBeNull();
        expect((screen.getByTestId('worksheet-picker-input') as HTMLInputElement).value).toBe('Fractions');
    });

    it('keyboard: ArrowDown highlights, Enter selects, Escape closes without selecting', () => {
        render(<PickerHarness plugins={[ADDITION, FRACTIONS]} />);
        const input = screen.getByTestId('worksheet-picker-input');
        fireEvent.focus(input);
        // ArrowDown highlights the first option (Addition)…
        fireEvent.keyDown(input, { key: 'ArrowDown' });
        const first = screen.getByTestId('worksheet-picker-option-addition');
        expect(first.getAttribute('aria-selected')).toBe('true'); // also the current selection

        // …ArrowDown again reaches Fractions; Enter selects it.
        fireEvent.keyDown(input, { key: 'ArrowDown' });
        fireEvent.keyDown(input, { key: 'Enter' });
        expect(probeStore!.active).toEqual({ pluginId: 'fractions', entryId: 'fractions' });
        expect(screen.queryByTestId('worksheet-picker-list')).toBeNull();

        // Reopen, ArrowDown + Escape: the dropdown closes and the selection
        // is unchanged (still Fractions).
        fireEvent.focus(input);
        fireEvent.keyDown(input, { key: 'ArrowDown' });
        fireEvent.keyDown(input, { key: 'Escape' });
        expect(screen.queryByTestId('worksheet-picker-list')).toBeNull();
        expect(probeStore!.active.pluginId).toBe('fractions');
        expect((screen.getByTestId('worksheet-picker-input') as HTMLInputElement).value).toBe('Fractions');
    });

    it('blur closes the dropdown without changing the selection', () => {
        render(<PickerHarness plugins={[ADDITION, FRACTIONS]} />);
        const input = screen.getByTestId('worksheet-picker-input');
        fireEvent.focus(input);
        fireEvent.change(input, { target: { value: 'fr' } });
        fireEvent.blur(input);
        expect(screen.queryByTestId('worksheet-picker-list')).toBeNull();
        // The selection is untouched (the harness has no registry fallback,
        // so nothing was selected) and the input re-displays the first
        // plugin's label.
        expect((screen.getByTestId('worksheet-picker-input') as HTMLInputElement).value).toBe('Addition');
    });
});

describe('WorksheetPicker — closed-state typing restarts the query (T6)', () => {
    it('a printable key while closed opens a FRESH query instead of appending to the selected label', () => {
        render(<PickerHarness plugins={[ADDITION, FRACTIONS, CALCULUS]} />);
        const input = screen.getByTestId('worksheet-picker-input');
        // The closed input mirrors the selection...
        expect((input as HTMLInputElement).value).toBe('Addition');
        // ...and typing while closed does NOT append to it ("Additionf"):
        // the key restarts the query with just the typed character.
        fireEvent.keyDown(input, { key: 'f' });
        expect(screen.getByTestId('worksheet-picker-list')).toBeDefined();
        expect((input as HTMLInputElement).value).toBe('f');
        const options = screen.getByTestId('worksheet-picker-list').querySelectorAll('[role="option"]');
        expect(options).toHaveLength(1);
        expect(options[0].getAttribute('data-testid')).toBe('worksheet-picker-option-fractions');

        // Continue typing (the list is open now): normal filtering.
        fireEvent.change(input, { target: { value: 'frac' } });
        expect(screen.getByTestId('worksheet-picker-list').querySelectorAll('[role="option"]')).toHaveLength(1);
    });

    it('after Escape the next keystroke restarts the query (the reported Additionfrac bug)', () => {
        render(<PickerHarness plugins={[ADDITION, FRACTIONS, CALCULUS]} />);
        const input = screen.getByTestId('worksheet-picker-input');
        fireEvent.focus(input);
        fireEvent.change(input, { target: { value: 'frac' } });
        // Escape closes WITHOUT selecting; the input shows the selection.
        fireEvent.keyDown(input, { key: 'Escape' });
        expect(screen.queryByTestId('worksheet-picker-list')).toBeNull();
        expect(probeStore!.active.pluginId).toBe('');
        expect((input as HTMLInputElement).value).toBe('Addition');
        // The next keystroke is a FRESH query — never "Additionc". 'c'
        // matches exactly the two worksheets containing it.
        fireEvent.keyDown(input, { key: 'c' });
        expect((input as HTMLInputElement).value).toBe('c');
        expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['½Fractions', '∂Calculus']);
    });

    it('typing while closed with a modifier key is left to the browser (no restart)', () => {
        render(<PickerHarness plugins={[ADDITION]} />);
        const input = screen.getByTestId('worksheet-picker-input');
        fireEvent.keyDown(input, { key: 'f', ctrlKey: true });
        // Ctrl+f is a browser shortcut: the dropdown stays closed.
        expect(screen.queryByTestId('worksheet-picker-list')).toBeNull();
    });
});

describe('WorksheetPicker — Enter without arrow-highlight picks the first match (T6)', () => {
    it('type + Enter selects the first filtered match', () => {
        render(<PickerHarness plugins={[ADDITION, FRACTIONS, CALCULUS]} />);
        const input = screen.getByTestId('worksheet-picker-input');
        fireEvent.focus(input);
        fireEvent.change(input, { target: { value: 'frac' } });
        // No arrow key pressed (highlight −1): Enter still chooses the one
        // match.
        fireEvent.keyDown(input, { key: 'Enter' });
        expect(probeStore!.active).toEqual({ pluginId: 'fractions', entryId: 'fractions' });
        expect(screen.queryByTestId('worksheet-picker-list')).toBeNull();
        expect((screen.getByTestId('worksheet-picker-input') as HTMLInputElement).value).toBe('Fractions');
    });

    it('type + Enter after a closed-state keystroke picks the first match coherently', () => {
        render(<PickerHarness plugins={[ADDITION, FRACTIONS, CALCULUS]} />);
        const input = screen.getByTestId('worksheet-picker-input');
        // Type while closed (fresh query 'c' → first match Fractions), then
        // Enter picks it — never a polluted "Additionc" search.
        fireEvent.keyDown(input, { key: 'c' });
        expect((input as HTMLInputElement).value).toBe('c');
        fireEvent.keyDown(input, { key: 'Enter' });
        expect(probeStore!.active).toEqual({ pluginId: 'fractions', entryId: 'fractions' });
        expect((screen.getByTestId('worksheet-picker-input') as HTMLInputElement).value).toBe('Fractions');
    });

    it('Enter with an empty query and no highlight picks the first worksheet', () => {
        render(<PickerHarness plugins={[ADDITION, FRACTIONS]} />);
        const input = screen.getByTestId('worksheet-picker-input');
        fireEvent.focus(input);
        fireEvent.keyDown(input, { key: 'Enter' });
        expect(probeStore!.active).toEqual({ pluginId: 'addition', entryId: 'addition' });
    });

    it('Enter with a no-match query does nothing (the disabled row is not pickable)', () => {
        render(<PickerHarness plugins={[ADDITION]} />);
        const input = screen.getByTestId('worksheet-picker-input');
        fireEvent.focus(input);
        fireEvent.change(input, { target: { value: 'zzz' } });
        fireEvent.keyDown(input, { key: 'Enter' });
        expect(probeStore!.active.pluginId).toBe('');
        // The list stays open (nothing was chosen).
        expect(screen.getByTestId('worksheet-picker-empty')).toBeDefined();
    });
});

describe('WorksheetPicker — aria-activedescendant tracks the highlight (T6)', () => {
    it('ArrowDown/ArrowUp move the activedescendant; query changes and Escape clear it', () => {
        render(<PickerHarness plugins={[ADDITION, FRACTIONS]} />);
        const input = screen.getByTestId('worksheet-picker-input');
        // Closed: absent.
        expect(input.getAttribute('aria-activedescendant')).toBeNull();
        fireEvent.focus(input);
        // Open, nothing highlighted: absent.
        expect(input.getAttribute('aria-activedescendant')).toBeNull();
        // ArrowDown highlights the first option...
        fireEvent.keyDown(input, { key: 'ArrowDown' });
        expect(input.getAttribute('aria-activedescendant')).toBe(`${PICKER_LIST_ID}-addition`);
        // ...again reaches Fractions.
        fireEvent.keyDown(input, { key: 'ArrowDown' });
        expect(input.getAttribute('aria-activedescendant')).toBe(`${PICKER_LIST_ID}-fractions`);
        // ArrowUp walks back to Addition.
        fireEvent.keyDown(input, { key: 'ArrowUp' });
        expect(input.getAttribute('aria-activedescendant')).toBe(`${PICKER_LIST_ID}-addition`);
        // A query change clears the highlight (and with it the attribute).
        fireEvent.change(input, { target: { value: 'frac' } });
        expect(input.getAttribute('aria-activedescendant')).toBeNull();
        // Highlight again, then Escape: the attribute is gone with the list.
        fireEvent.keyDown(input, { key: 'ArrowDown' });
        expect(input.getAttribute('aria-activedescendant')).toBe(`${PICKER_LIST_ID}-fractions`);
        fireEvent.keyDown(input, { key: 'Escape' });
        expect(input.getAttribute('aria-activedescendant')).toBeNull();
        expect(screen.queryByTestId('worksheet-picker-list')).toBeNull();
        // Escape preserved the selection.
        expect(probeStore!.active.pluginId).toBe('');
        expect((input as HTMLInputElement).value).toBe('Addition');
    });
});

describe('WorksheetPicker — prepared science slots', () => {
    it('renders disabled with the "no worksheets yet" placeholder', () => {
        render(<PickerHarness plugins={[]} disabled />);
        const input = screen.getByTestId('worksheet-picker-input') as HTMLInputElement;
        expect(input.disabled).toBe(true);
        expect(input.placeholder).toBe('No worksheets yet');
        // Focus does NOT open the dropdown for an empty subject.
        fireEvent.focus(input);
        expect(screen.queryByTestId('worksheet-picker-list')).toBeNull();
    });
});
