import QuestAPI      from '../../control/QuestAPI.js';
import QuestDB       from '../../control/QuestDB.js';
import ViewManager   from '../../control/ViewManager.js';
import Socket        from '../../control/Socket.js';
import FQLDialog     from '../FQLDialog.js';

/**
 * Provides all jQuery callbacks for the {@link QuestLog}.
 */
export default class HandlerLog
{
   /**
    * Handles the quest add button.
    *
    * @returns {Promise<void>}
    */
   static async questAdd()
   {
      if (ViewManager.verifyQuestCanAdd())
      {
         const quest = await QuestDB.createQuest();
         ViewManager.questAdded({ quest });
      }
   }

   /**
    * Handles deleting a quest. The trashcan icon.
    *
    * @param {Event} event - HTML5 / jQuery event.
    *
    * @returns {Promise<void>} A promise
    */
   static async questDelete(event)
   {
      const questId = $(event.target).data('quest-id');
      const name = $(event.target).data('quest-name');

      const result = await FQLDialog.confirmDeleteQuest({ name, result: questId, questId, isQuestLog: true });
      if (result)
      {
         await QuestDB.deleteQuest({ questId: result });
      }
   }

   /**
    * Prepares the data transfer when a quest is dragged from the {@link QuestLog}.
    *
    * @param {Event} event - HTML5 / jQuery event.
    */
   static questDragStart(event)
   {
      const dataTransfer = {
         type: 'Quest',
         id: $(event.target).data('quest-id')
      };

      event.originalEvent.dataTransfer.setData('text/plain', JSON.stringify(dataTransfer));
   }

   /**
    * Handles the quest open click via {@link QuestAPI.open}.
    *
    * @param {Event} event - HTML5 / jQuery event.
    */
   static questOpen(event)
   {
      const questId = $(event.target).closest('.title').data('quest-id');
      QuestAPI.open({ questId });
   }

   /**
    * Handles changing the quest status via {@link Socket.moveQuest}.
    *
    * @param {Event} event - HTML5 / jQuery event.
    *
    * @returns {Promise<void>} A promise
    */
   static async questStatusSet(event)
   {
      const target = $(event.target).data('target');
      const questId = $(event.target).data('quest-id');

      const quest = QuestDB.getQuest(questId);
      if (quest) { await Socket.moveQuest({ quest, target }); }
   }
}