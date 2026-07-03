# Equipment Search & Filter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add real-time text search and checkbox status filters to the equipment checklist, featuring auto-expanding topics and search text highlighting.

**Architecture:** Maintain search query and status filter state in the parent checklist component. Filter the checklist data structure dynamically on render, automatically expanding matching topics and using a JSX string parser to wrap matching substrings in highlight tags.

**Tech Stack:** React (React 19), Vitest, React Testing Library, Lucide Icons, Vanilla CSS

---

### Task 1: CSS Layout and Theming

**Files:**
- Modify: `src/index.css`

- [ ] **Step 1: Add new styles for the search/filter bar, input wrapper, filter chips, and highlighted text**

```css
/* Equipment Search and Filter Bar */
.equipment-search-filter-bar {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  background: var(--surface-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  margin-bottom: 0.5rem;
}

.equipment-search-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.equipment-search-icon-left {
  position: absolute;
  right: 0.875rem;
  color: var(--text-muted);
  pointer-events: none;
}

.equipment-search-input {
  width: 100%;
  padding: 0.75rem 2.5rem 0.75rem 0.875rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-family: 'Heebo', sans-serif;
  font-size: 0.95rem;
  transition: var(--transition-smooth);
  direction: rtl;
}

.equipment-search-input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 2px var(--glow-primary);
  outline: none;
  background: rgba(255, 255, 255, 0.05);
}

.equipment-search-clear-btn {
  position: absolute;
  left: 0.875rem;
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: var(--transition-smooth);
}

.equipment-search-clear-btn:hover {
  color: var(--text-primary);
  background: var(--surface-hover);
}

.equipment-filter-chips {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.equipment-filter-chip {
  padding: 0.375rem 0.875rem;
  border-radius: 9999px;
  background: var(--surface-hover);
  border: 1px solid var(--border);
  color: var(--text-secondary);
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition-smooth);
  font-family: 'Heebo', sans-serif;
}

.equipment-filter-chip:hover {
  background: var(--border);
  color: var(--text-primary);
}

.equipment-filter-chip.active {
  background: var(--glow-primary);
  border-color: var(--primary);
  color: var(--primary);
  box-shadow: 0 0 8px var(--glow-primary);
}

/* Highlighted matching search text */
.search-highlight {
  background-color: rgba(var(--primary-rgb, 147, 51, 234), 0.3);
  color: var(--primary);
  border-radius: 2px;
  padding: 0 2px;
  font-weight: 600;
}

@media (max-width: 480px) {
  .equipment-search-filter-bar {
    padding: 0.75rem;
  }
  .equipment-filter-chips {
    justify-content: space-between;
  }
  .equipment-filter-chip {
    flex: 1;
    text-align: center;
    padding: 0.5rem 0.25rem;
    font-size: 0.8rem;
  }
}
```

- [ ] **Step 2: Commit CSS changes**

```bash
git add src/index.css
git commit -m "style: add styles for equipment search and filter controls"
```

---

### Task 2: Component State, Logic and UI Implementation

**Files:**
- Modify: `src/components/EquipmentChecklist.jsx`

- [ ] **Step 1: Update the imports, state declaration, helper functions, and logic**

Modify `src/components/EquipmentChecklist.jsx` to import `Search` and `X` from `lucide-react`, manage `searchTerm` and `statusFilter` states, implement a text highlight function, and filter lists dynamically before rendering.

Here is the exact implementation detail for the highlight helper and render filtering:

```jsx
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const highlightText = (text, highlight) => {
    if (!highlight.trim()) return text;
    const regex = new RegExp(`(${highlight.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="search-highlight">{part}</mark>
      ) : part
    );
  };
```

Update `renderSection` to apply filters when `isPrint` is false:
```jsx
  const renderSection = (key, section, isPrint = false) => {
    const isActive = activeKey === key;
    
    // Filter topics and items based on search and status
    const filteredTopics = section.topics.map(topic => {
      const filteredItems = topic.items.filter(item => {
        // Status filter
        const matchesStatus = 
          statusFilter === 'all' ||
          (statusFilter === 'checked' && isChecked(item.id)) ||
          (statusFilter === 'unchecked' && !isChecked(item.id));
        
        if (!matchesStatus) return false;

        // Search filter
        if (!searchTerm.trim()) return true;
        const query = searchTerm.toLowerCase();
        const matchesLabel = item.label.toLowerCase().includes(query);
        const matchesHint = item.hint && item.hint.toLowerCase().includes(query);
        return matchesLabel || matchesHint;
      });

      return {
        ...topic,
        items: filteredItems
      };
    }).filter(topic => topic.items.length > 0);

    const progress = getSectionProgress(section);
    const displayTopics = isPrint ? section.topics : filteredTopics;

    return (
      <div 
        key={key} 
        className={`equipment-section-wrapper ${key}-section ${isActive ? 'active-tab' : ''} ${isPrint ? 'print-section' : ''}`}
      >
        <div className="equipment-section-header">
          <h3>{section.title}</h3>
          <span className="equipment-progress-badge">
            {progress.done}/{progress.total} סומנו
          </span>
        </div>

        <div className="equipment-topics">
          {displayTopics.length === 0 ? (
            <div className="equipment-empty-search" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              לא נמצאו פריטים המתאימים לסינון הנוכחי.
            </div>
          ) : (
            displayTopics.map((topic) => {
              // Auto-expand if search is active
              const isOpen = isPrint || (searchTerm.trim() !== '' ? true : !!openTopics[topic.id]);
              const topicProgress = getTopicProgress(topic);
              return (
                <div 
                  key={topic.id} 
                  className={`equipment-topic ${isOpen ? 'open' : ''}`} 
                  data-testid={`equipment-topic-${topic.id}`}
                >
                  <button
                    type="button"
                    className="equipment-topic-header"
                    data-testid={`equipment-topic-header-${topic.id}`}
                    onClick={isPrint ? undefined : () => toggleTopic(topic.id)}
                  >
                    <span className="equipment-topic-heading">
                      {isPrint ? topic.heading : highlightText(topic.heading, searchTerm)}
                    </span>
                    <span className="equipment-topic-right">
                      <span className="equipment-topic-progress">{topicProgress.done}/{topicProgress.total}</span>
                      {!isPrint && (isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />)}
                    </span>
                  </button>
                  
                  {(isPrint || isOpen) && (
                    <div className="equipment-topic-body" data-testid={`equipment-topic-body-${topic.id}`}>
                      {topic.items.map((item) => (
                        <label
                          key={item.id}
                          className="equipment-item"
                          data-testid={`equipment-item-${item.id}`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked(item.id)}
                            onChange={isPrint ? undefined : () => toggle(item.id)}
                            disabled={isPrint}
                          />
                          <span className="equipment-item-text">
                            <span className="equipment-item-label">
                              {isPrint ? item.label : highlightText(item.label, searchTerm)}
                            </span>
                            {item.hint && (
                              <span className="equipment-item-hint">
                                {isPrint ? item.hint : highlightText(item.hint, searchTerm)}
                              </span>
                            )}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };
```

Render the search filter bar in the return statement:
```jsx
  return (
    <div className="equipment-checklist stagger-slide-up" style={{ '--card-index': 0 }}>
      {/* existing top-level actions */}
      
      {/* Search and Filter bar */}
      <div className="equipment-search-filter-bar">
        <div className="equipment-search-wrapper">
          <Search className="equipment-search-icon-left" size={18} />
          <input
            type="text"
            className="equipment-search-input"
            placeholder="חיפוש פריט או רמז עזר..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              type="button"
              className="equipment-search-clear-btn"
              onClick={() => setSearchTerm('')}
              title="נקה חיפוש"
            >
              <X size={16} />
            </button>
          )}
        </div>
        <div className="equipment-filter-chips">
          <button
            type="button"
            className={`equipment-filter-chip ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            הכל
          </button>
          <button
            type="button"
            className={`equipment-filter-chip ${statusFilter === 'unchecked' ? 'active' : ''}`}
            onClick={() => setStatusFilter('unchecked')}
          >
            טרם סומנו
          </button>
          <button
            type="button"
            className={`equipment-filter-chip ${statusFilter === 'checked' ? 'active' : ''}`}
            onClick={() => setStatusFilter('checked')}
          >
            סומנו
          </button>
        </div>
      </div>

      {/* existing section tabs and content */}
```

- [ ] **Step 2: Commit React component changes**

```bash
git add src/components/EquipmentChecklist.jsx
git commit -m "feat: implement real-time search, filters, text highlighting, and auto-expanding in EquipmentChecklist"
```

---

### Task 3: Unit Tests Update

**Files:**
- Modify: `src/components/EquipmentChecklist.spec.jsx`

- [ ] **Step 1: Write tests for filtering and searching features**

Add tests to `src/components/EquipmentChecklist.spec.jsx` asserting that:
1. Typing in search filters the visible list items.
2. Clicking "טרם סומנו" displays only unchecked items.
3. Clicking "סומנו" displays only checked items.
4. Auto-expand expands sections when a search query is active.

```javascript
  it('filters items by typing in search and highlights matches', () => {
    render(<EquipmentChecklist />);
    
    // Type 'שולחן' into the search input
    const searchInput = screen.getByPlaceholderText('חיפוש פריט או רמז עזר...');
    fireEvent.change(searchInput, { target: { value: 'שולחן' } });
    
    // Auto-expands and displays matching items
    expect(screen.getByText('שולחן מתקפל')).toBeTruthy();
    
    // Topics with no matching items should be hidden
    expect(screen.queryByText('תכנון, חלוקה וסימון המחנה')).toBeNull();
  });

  it('filters items by checked/unchecked status', () => {
    render(<EquipmentChecklist />);
    
    // Expand a topic
    fireEvent.click(screen.getByText('מחסה, צל והגנה מגשם'));
    expect(screen.getByText('אוהלים קבוצתיים או אוהל ציוד')).toBeTruthy();
    
    // Check one item
    fireEvent.click(screen.getByTestId('equipment-item-shared-tents'));
    
    // Filter by unchecked items
    fireEvent.click(screen.getByText('טרם סומנו'));
    expect(screen.queryByText('אוהלים קבוצתיים או אוהל ציוד')).toBeNull();
    
    // Filter by checked items
    fireEvent.click(screen.getByText('סומנו'));
    expect(screen.getByText('אוהלים קבוצתיים או אוהל ציוד')).toBeTruthy();
  });
```

- [ ] **Step 2: Commit unit test changes**

```bash
git add src/components/EquipmentChecklist.spec.jsx
git commit -m "test: add unit tests for EquipmentChecklist search and filter features"
```

---

### Task 4: Full Validation Run

- [ ] **Step 1: Run all tests using Vitest**

Run: `npm run test`
Expected output: All 131 tests pass (including 2 new tests).

- [ ] **Step 2: Run linter**

Run: `npm run lint`
Expected output: Zero errors/warnings.
