export default defineBackground(() => {
  void chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {
    // No credential handling or network requests belong in the event worker.
    console.error('Real Job: unable to enable the side panel action.');
  });
});
