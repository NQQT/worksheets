// ─────────────────────────────────────────────────────────────────────────────
// Worksheet picker — the accessible searchable/autosuggest dropdown that
// replaces the legacy plugin rail (R2).
//
// The left rail lists SUBJECTS only; the right side hosts THIS picker listing
// the ACTIVE subject's worksheets. The list comes from the registration
// registry (plugins filtered by subject in components/WorksheetsDashboard.tsx)
// — there is no hardcoded worksheet switch anywhere.
//
// ARIA COMBOBOX PATTERN: a text input (role="combobox", aria-expanded,
// aria-controls, aria-autocomplete="list") opening a filtered listbox
// (role="listbox" with role="option" children). Keyboard support:
//   ArrowDown / ArrowUp — move the highlighted option (wraps);
//   Enter               — select the highlighted option;
//   Escape              — close the dropdown without changing the selection.
// The input mirrors the current worksheet's label when closed and the search
// text while open. Options are BUTTONS whose mousedown is prevented, so
// clicking one never blurs the input prematurely.
//
// SEARCH: case-insensitive substring match over the worksheet label and its
// registry id ("frac" → Fractions, "bond" → Number Bonds). No query lists
// every worksheet of the subject; a query with no matches shows one disabled
// "no match" option so the listbox is never empty.
//
// CLOSED-STATE TYPING (T6 fix): the closed input displays the SELECTED
// label, so letting the DOM append a character would pollute the next query
// ("Additionfrac"). A printable key while closed is swallowed and RESTARTS
// the query with just that character — reopened typing is always a fresh,
// coherent search. Enter picks the highlighted option, or the FIRST MATCH
// when nothing is highlighted yet (type + Enter). The combobox exposes the
// keyboard highlight through aria-activedescendant (the highlighted option's
// id), cleared on query changes and whenever the list closes.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useMemo, useRef, useState } from 'react';
import { styledComponent } from '@presource/react';
import { selectEntry, useDashboardStore } from './store';
import type { DashboardPlugin, PluginSidebarEntry } from './types';

export type WorksheetPickerProps = {
    // The ACTIVE subject's plugins, in registration order.
    plugins: DashboardPlugin[];
    // Whether the subject has any worksheets at all (disables the picker for
    // the prepared science slots until the science plugins land).
    disabled?: boolean;
};

const PickerField = styledComponent('div', {
    position: 'relative',
    minWidth: '180px',
    flexShrink: 0
});

// The combobox input — themed like the other header pills.
const PickerInput = styledComponent('input', {
    height: '32px',
    width: '100%',
    padding: '0 12px',
    borderRadius: '999px',
    border: '1px solid var(--hairline)',
    background: 'var(--surface-input)',
    color: 'var(--app-fg)',
    fontSize: '13px',
    fontWeight: 600,
    outline: 'none',
    boxSizing: 'border-box',
    cursor: 'text'
}) as unknown as React.ForwardRefExoticComponent<
    React.InputHTMLAttributes<HTMLInputElement> & {
        theme?: any;
        [breakpoint: string]: any;
    }
>;

// The dropdown panel: absolutely positioned under the input, above everything
// else in the header (the header is the sticky top bar).
const PickerList = styledComponent('ul', {
    position: 'absolute',
    top: '38px',
    right: 0,
    zIndex: 40,
    margin: 0,
    padding: '6px',
    listStyle: 'none',
    maxHeight: '320px',
    minWidth: '260px',
    overflowY: 'auto',
    background: 'var(--surface)',
    border: '1px solid var(--hairline)',
    borderRadius: '12px',
    boxShadow: 'var(--shadow-card-lg)',
    boxSizing: 'border-box'
}) as unknown as React.ForwardRefExoticComponent<
    React.HTMLAttributes<HTMLUListElement> & {
        theme?: any;
        [breakpoint: string]: any;
    }
>;

const PickerOption = styledComponent<{ highlighted: boolean; selected: boolean }>('li', {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '7px 10px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: ({ selected }) => (selected ? 700 : 500),
    cursor: 'pointer',
    background: ({ highlighted, selected }) =>
        highlighted || selected ? 'var(--active-fill)' : 'transparent',
    color: ({ highlighted, selected }) =>
        highlighted || selected ? 'var(--active-rail-text)' : 'var(--control-fg)',
    whiteSpace: 'nowrap'
}) as unknown as React.ForwardRefExoticComponent<
    React.HTMLAttributes<HTMLLIElement> & {
        highlighted: boolean;
        selected: boolean;
        theme?: any;
        [breakpoint: string]: any;
    }
>;

// The disabled "no match" row (rendered as a listbox option with
// aria-disabled so the listbox is never empty).
const PickerEmpty = styledComponent('li', {
    padding: '7px 10px',
    fontSize: '13px',
    color: 'var(--muted)',
    whiteSpace: 'nowrap',
    cursor: 'default'
});

// The icon chip inside an option row.
const OptionIcon = styledComponent('span', {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '22px',
    height: '22px',
    flexShrink: 0,
    borderRadius: '7px',
    background: 'var(--active-fill)',
    color: 'var(--primary)',
    fontSize: '12px'
});

export const PICKER_LIST_ID = 'worksheet-picker-list';

export function WorksheetPicker({ plugins, disabled = false }: WorksheetPickerProps) {
    const store = useDashboardStore();
    const [open, setOpen] = useState(false);
    // The search text while the dropdown is open ('' = show all).
    const [query, setQuery] = useState('');
    // Keyboard-highlighted option index (−1 = none).
    const [highlight, setHighlight] = useState(-1);
    const inputRef = useRef<HTMLInputElement>(null);

    // The currently selected worksheet (for the closed-input label).
    const selected = plugins.find((p) => p.id === store.active.pluginId) ?? plugins[0];
    const selectedEntry: PluginSidebarEntry | undefined = selected?.entries[0];

    // Filtered, ordered options (registration order preserved).
    const options = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return plugins;
        return plugins.filter(
            (p) =>
                p.entries[0]?.label.toLowerCase().includes(q) ||
                p.id.toLowerCase().includes(q)
        );
    }, [plugins, query]);

    // Set when a selection just closed the dropdown: the programmatic refocus
    // below re-fires the input's onFocus, which must NOT reopen the list.
    const suppressFocusRef = useRef(false);

    const close = () => {
        setOpen(false);
        setQuery('');
        setHighlight(-1);
    };

    const choose = (plugin: DashboardPlugin) => {
        selectEntry(store, plugin.id, plugin.entries[0]?.id ?? '');
        close();
        // Return focus to the combobox so keyboard users stay in place; the
        // suppressed-focus guard stops the refocus from reopening the list.
        suppressFocusRef.current = true;
        inputRef.current?.focus();
    };

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (disabled) return;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setOpen(true);
            setHighlight((h) => (options.length === 0 ? -1 : (h + 1) % options.length));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setOpen(true);
            setHighlight((h) => (options.length === 0 ? -1 : (h - 1 + options.length) % options.length));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (open) {
                // Enter picks the highlighted option, or the FIRST MATCH when
                // nothing has been arrow-highlighted yet (type + Enter). No
                // matches → no-op (the disabled empty row is not pickable).
                const target = highlight >= 0 ? options[highlight] : options[0];
                if (target) choose(target);
            }
        } else if (e.key === 'Escape') {
            if (open) {
                e.preventDefault();
                close();
            }
        } else if (!open && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
            // PRINTABLE KEY WHILE CLOSED: the closed input displays the
            // selected label, so the DOM append would pollute the query
            // ("Additionfrac"). Swallow the character and RESTART the query
            // with just this key — a fresh, coherent search.
            e.preventDefault();
            setOpen(true);
            setQuery(e.key);
            setHighlight(-1);
        }
    };

    // The highlighted option's DOM id (the option ids are `${LIST_ID}-${id}`),
    // exposed as aria-activedescendant and CLEARED whenever no option is
    // highlighted (query change) or the list is closed.
    const activeDescendant =
        open && highlight >= 0 && options[highlight]
            ? `${PICKER_LIST_ID}-${options[highlight].id}`
            : undefined;

    return (
        <PickerField data-testid="worksheet-picker">
            <PickerInput
                ref={inputRef as any}
                role="combobox"
                aria-expanded={open}
                aria-controls={PICKER_LIST_ID}
                aria-autocomplete="list"
                aria-haspopup="listbox"
                aria-label="Worksheet"
                aria-activedescendant={activeDescendant}
                disabled={disabled}
                data-testid="worksheet-picker-input"
                value={open ? query : selectedEntry?.label ?? ''}
                placeholder={disabled ? 'No worksheets yet' : 'Search worksheets…'}
                onFocus={() => {
                    if (disabled) return;
                    // A just-completed selection refocused the input — keep
                    // the dropdown closed (the user already picked).
                    if (suppressFocusRef.current) {
                        suppressFocusRef.current = false;
                        return;
                    }
                    setOpen(true);
                    setQuery('');
                    setHighlight(-1);
                }}
                onChange={(e) => {
                    setOpen(true);
                    setQuery(e.target.value);
                    setHighlight(-1);
                }}
                onKeyDown={onKeyDown}
                onBlur={() => {
                    // Blur (click-away, tab) always closes; the selection is
                    // untouched — the input re-displays the selected label.
                    close();
                }}
            />
            {open && !disabled && (
                <PickerList id={PICKER_LIST_ID} role="listbox" aria-label="Worksheets" data-testid="worksheet-picker-list">
                    {options.length === 0 ? (
                        <PickerEmpty role="option" aria-disabled="true" data-testid="worksheet-picker-empty">
                            No matching worksheets
                        </PickerEmpty>
                    ) : (
                        options.map((plugin, i) => {
                            const entry = plugin.entries[0];
                            const isSelected = selected?.id === plugin.id;
                            return (
                                <PickerOption
                                    key={plugin.id}
                                    id={`${PICKER_LIST_ID}-${plugin.id}`}
                                    role="option"
                                    aria-selected={isSelected}
                                    highlighted={i === highlight}
                                    selected={isSelected}
                                    data-testid={`worksheet-picker-option-${plugin.id}`}
                                    // preventDefault on mousedown keeps the
                                    // input focused through the click.
                                    onMouseDown={(e: React.MouseEvent) => e.preventDefault()}
                                    onClick={() => choose(plugin)}
                                >
                                    <OptionIcon aria-hidden="true">{entry?.icon ?? ''}</OptionIcon>
                                    <span>{entry?.label ?? plugin.id}</span>
                                </PickerOption>
                            );
                        })
                    )}
                </PickerList>
            )}
        </PickerField>
    );
}
