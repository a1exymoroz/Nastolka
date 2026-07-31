export const TOUR_STEPS = [
  {
    id: 'create-location',
    route: 'locations',
    target: 'locations-create-form',
    titleKey: 'tour.steps.createLocation.title',
    bodyKey: 'tour.steps.createLocation.body',
  },
  {
    id: 'edit-location',
    route: 'location-detail',
    target: 'location-edit-toggle',
    titleKey: 'tour.steps.editLocation.title',
    bodyKey: 'tour.steps.editLocation.body',
  },
  {
    id: 'history-crud',
    route: 'location-detail',
    target: 'history-log-session',
    titleKey: 'tour.steps.historyCrud.title',
    bodyKey: 'tour.steps.historyCrud.body',
  },
  {
    id: 'history-photos',
    route: 'location-detail',
    target: 'history-log-session',
    titleKey: 'tour.steps.historyPhotos.title',
    bodyKey: 'tour.steps.historyPhotos.body',
  },
]
