import ViewManager from './ViewManager.js';

import { constants, settings } from '../model/constants.js';

/**
 * Buffer space between sidebar and right side of quest tracker.
 *
 * @type {number}
 */
const s_SPACE_X = 8;

/**
 * Buffer space between hotbar and bottom side of quest tracker.
 *
 * @type {number}
 */
const s_SPACE_Y = 8;

/**
 * Manages the state of the Foundry {@link Sidebar} providing management of the {@link QuestTracker}. Controls
 * pinning the QuestTracker to the sidebar.
 */
export default class SidebarManager
{
   /**
    * Registers window event callbacks if {@link FQLSettings.questTrackerManaged} is true. Also invoked from
    * {@link ModuleSettings} for changes to {@link FQLSettings.questTrackerManaged}.
    *
    * @param {object}   [opts] - Optional parameters.
    *
    * @param {boolean}  [opts.updateTracker=false] - Update QuestTracker.
    */
   static init({ updateTracker = false } = {})
   {
      if (game.settings.get(constants.moduleName, settings.questTrackerManaged))
      {
         window.addEventListener('resize', s_WINDOW_RESIZE);
      }

      sidebar.currentCollapsed = ui.sidebar._collapsed;
      s_STORE_STATE();

      if (updateTracker) { SidebarManager.updateTracker(); }
   }

   /**
    * Check the position against the sidebar and hotbar.
    *
    * @param {object}   position - The complete position with top, left, width, height keys.
    *
    * @returns {boolean} True if the new position is within the sidebar pinned rectangle.
    */
   static checkPosition(position)
   {
      const sidebarData = sidebar.currentCollapsed ? sidebar.collapsed : sidebar.open;
      const tracker = ViewManager.questTracker;

      // Detect if the new position overlaps with the sidebar.
      if (sidebarData.gapX >= 0 && position.left + tracker.position.width > sidebarData.left - s_SPACE_X)
      {
         // This is a resize width change, so limit the new position width to the sidebar left side.
         if (position.resizeWidth)
         {
            position.width = sidebarData.left - s_SPACE_X - position.left;
         }
         else // Otherwise move the new position to the left pinning the position to the sidebar left.
         {
            position.left = sidebarData.left - s_SPACE_X - tracker.position.width;
            if (position.left < 0) { position.left = 0; }
         }
      }

      // If not pinned adjust the position top based on the hotbar top.
      if (!tracker.pinned && hotbar.gapY >= 0 && position.top + position.height > hotbar.top)
      {
         if (position.resizeHeight)
         {
            position.height = hotbar.top - s_SPACE_Y - position.top;
            tracker.position.height = position.height;
         }
         else
         {
            position.top = hotbar.top - s_SPACE_Y - position.height;
            if (position.top < 0) { position.top = 0; }
         }
      }

      // If pinned always make sure the position top is the sidebar top.
      if (tracker.pinned) { position.top = sidebarData.top; }

      return sidebarData.rectDock.contains(position.left + position.width, position.top);
   }

   /**
    * The `collapseSidebar` Hook callback. Store the new state and update the tracker.
    *
    * @param {Sidebar}  sidebarUI - The Foundry Sidebar.
    *
    * @param {boolean}  collapsed - The sidebar collapsed state.
    */
   static collapseSidebar(sidebarUI, collapsed)
   {
      sidebar.currentCollapsed = collapsed;
      s_STORE_STATE();
      SidebarManager.updateTracker();
   }

   /**
    * Updates the tracker bounds based on pinned state
    */
   static updateTracker()
   {
      const tracker = ViewManager.questTracker;

      if (!tracker.rendered || !game.settings.get(constants.moduleName, settings.questTrackerManaged)) { return; }

      const sidebarData = sidebar.currentCollapsed ? sidebar.collapsed : sidebar.open;

      const position = {
         pinned: false,
         top: tracker.position.top,
         left: tracker.position.left,
         width: tracker.position.width,
         height: tracker.position.height
      };

      if (tracker.pinned)
      {
         position.top = sidebarData.top;
         position.left = sidebarData.left - tracker.position.width - s_SPACE_X;
      }
      else
      {
         const trackerRight = tracker.position.left + tracker.position.width;
         if (trackerRight > sidebarData.left - s_SPACE_X)
         {
            position.left = sidebarData.left - tracker.position.width - s_SPACE_X;
            if (position.left < 0) { position.left = 0; }
         }

         const trackerBottom = tracker.position.top + tracker.position.height;
         if (trackerBottom > hotbar.top - s_SPACE_Y)
         {
            position.top = hotbar.top - tracker.position.height - s_SPACE_Y;
            if (position.top < 0) { position.top = 0; }
         }
      }

      tracker.setPosition(position);
   }

   /**
    * Unregisters window event callbacks. Invoked from {@link ModuleSettings} for changes to
    * {@link FQLSettings.questTrackerManaged}.
    */
   static unregister()
   {
      window.removeEventListener('resize', s_WINDOW_RESIZE);
   }
}

/**
 * Defines a rectangle with essential contains check.
 */
class FQLRect
{
   /**
    * @param {number}   x - Left
    *
    * @param {number}   y - Top
    *
    * @param {number}   width - Width
    *
    * @param {number}   height - Height
    */
   constructor(x, y, width, height)
   {
      /**
       * @type {number}
       */
      this.x = x;

      /**
       * @type {number}
       */
      this.y = y;

      /**
       * @type {number}
       */
      this.width = width;

      /**
       * @type {number}
       */
      this.height = height;
   }

   /**
    * Tests if the point is contained by this FQLRect.
    *
    * @param {number}   x - Point X
    *
    * @param {number}   y - Point Y
    *
    * @returns {boolean} Is point contained in rectangle.
    */
   contains(x, y)
   {
      return this.x <= x && x <= this.x + this.width && this.y <= y && y <= this.y + this.height;
   }
}

/**
 * Stores the state of the sidebar.
 *
 * @type {object}
 */
const sidebar = {
   currentCollapsed: false,

   collapsed: {
      gapX: -1,
      gapY: -1,
      top: -1,
      left: -1,
      width: -1,
      height: -1,
      rectDock: new FQLRect(0, 0, 15, 30)
   },

   open: {
      gapX: -1,
      gapY: -1,
      top: -1,
      left: -1,
      width: -1,
      height: -1,
      rectDock: new FQLRect(0, 0, 15, 30)
   }
};

/**
 * Stores the bounds of the hotbar.
 *
 * @type {object}
 */
const hotbar = {
   gapX: -1,
   gapY: -1,
   top: -1,
   left: -1,
   width: -1,
   height: -1
};

/**
 * Stores the current sidebar state.
 */
function s_STORE_STATE()
{
   const sidebarElem = ui?.sidebar?.element[0];
   const sidebarRect = sidebarElem?.getBoundingClientRect();

   if (sidebarRect)
   {
      const sidebarData = sidebar.currentCollapsed ? sidebar.collapsed : sidebar.open;

      // Store gapX / gapY calculating any ::before elements if it has not already been set.
      // This is only calculated one time on startup.
      if (sidebarData.gapX < 0)
      {
         let beforeWidth;
         let beforeHeight;
         try
         {
            const style = window.getComputedStyle(sidebarElem, 'before');

            const width = parseInt(style.getPropertyValue('width'), 10);
            if (!Number.isNaN(width)) { beforeWidth = width; }

            const height = parseInt(style.getPropertyValue('height'), 10);
            if (!Number.isNaN(height)) { beforeHeight = height; }
         }
         catch (err) { /**/ }

         sidebarData.gapX = beforeWidth && beforeWidth > sidebarRect.width ? beforeWidth - sidebarRect.width : 0;
         sidebarData.gapY = beforeHeight && beforeHeight > sidebarRect.height ? beforeHeight - sidebarRect.height : 0;
      }

      sidebarData.left = sidebarRect.left - sidebarData.gapX;
      sidebarData.top = sidebarRect.top - sidebarData.gapY;
      sidebarData.width = sidebarRect.width + sidebarData.gapX;
      sidebarData.height = sidebarRect.height + sidebarData.gapY;

      sidebarData.rectDock.x = sidebarData.left - sidebarData.rectDock.width;
   }

   const hotbarElem = ui?.hotbar?.element[0];
   const hotbarRect = hotbarElem?.getBoundingClientRect();

   if (hotbarRect)
   {
      if (hotbar.gapX < 0)
      {
         let beforeWidth;
         let beforeHeight;
         try
         {
            const style = window.getComputedStyle(hotbarElem, 'before');

            const width = parseInt(style.getPropertyValue('width'), 10);
            if (!Number.isNaN(width)) { beforeWidth = width; }

            const height = parseInt(style.getPropertyValue('height'), 10);
            if (!Number.isNaN(height)) { beforeHeight = height; }
         }
         catch (err) { /**/ }

         hotbar.gapX = beforeWidth && beforeWidth > hotbarRect.width ? beforeWidth - hotbarRect.width : 0;
         hotbar.gapY = beforeHeight && beforeHeight > hotbarRect.height ? beforeHeight - hotbarRect.height : 0;
      }

      hotbar.left = hotbarRect.left - hotbar.gapX;
      hotbar.top = hotbarRect.top - hotbar.gapY;
      hotbar.width = hotbarRect.width + hotbar.gapX;
      hotbar.height = hotbarRect.height + hotbar.gapY;
   }
}

/**
 * Callback for window resize events.
 */
function s_WINDOW_RESIZE()
{
   s_STORE_STATE();
   SidebarManager.updateTracker();
}