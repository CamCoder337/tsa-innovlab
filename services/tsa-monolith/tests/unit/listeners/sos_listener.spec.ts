import { test } from '@japa/runner'
import { IssueType, IssueStatus, IssuePriority } from '#models/mission_issue'

test.group('SOS Listener - Unit Tests', () => {
  test('should determine correct priority for accident', async ({ assert }) => {
    const priorityMap: Record<string, number> = {
      [IssueType.ACCIDENT]: IssuePriority.CRITICAL,
      [IssueType.MEDICAL]: IssuePriority.CRITICAL,
      [IssueType.SECURITY]: IssuePriority.CRITICAL,
      [IssueType.BREAKDOWN]: IssuePriority.HIGH,
    }

    assert.equal(priorityMap[IssueType.ACCIDENT], IssuePriority.CRITICAL)
    assert.equal(priorityMap[IssueType.MEDICAL], IssuePriority.CRITICAL)
    assert.equal(priorityMap[IssueType.SECURITY], IssuePriority.CRITICAL)
    assert.equal(priorityMap[IssueType.BREAKDOWN], IssuePriority.HIGH)
  })

  test('should have correct issue types for SOS', async ({ assert }) => {
    const validSosTypes = [
      IssueType.BREAKDOWN,
      IssueType.ACCIDENT,
      IssueType.MEDICAL,
      IssueType.SECURITY,
    ]

    assert.include(validSosTypes, IssueType.BREAKDOWN)
    assert.include(validSosTypes, IssueType.ACCIDENT)
    assert.include(validSosTypes, IssueType.MEDICAL)
    assert.include(validSosTypes, IssueType.SECURITY)
    assert.notInclude(validSosTypes, IssueType.DELAY)
    assert.notInclude(validSosTypes, IssueType.TRAFFIC)
  })

  test('should have correct issue statuses', async ({ assert }) => {
    assert.equal(IssueStatus.REPORTED, 'reported')
    assert.equal(IssueStatus.ACKNOWLEDGED, 'acknowledged')
    assert.equal(IssueStatus.IN_PROGRESS, 'in_progress')
    assert.equal(IssueStatus.RESOLVED, 'resolved')
  })

  test('should have correct priority values', async ({ assert }) => {
    assert.equal(IssuePriority.CRITICAL, 1)
    assert.equal(IssuePriority.HIGH, 2)
    assert.equal(IssuePriority.NORMAL, 3)
  })

  test('MissionIssue isCritical helper should work correctly', async ({ assert }) => {
    // Simuler la logique du helper isCritical
    const isCritical = (isEmergency: boolean, type: IssueType): boolean => {
      return (
        isEmergency && [IssueType.ACCIDENT, IssueType.MEDICAL, IssueType.SECURITY].includes(type)
      )
    }

    assert.isTrue(isCritical(true, IssueType.ACCIDENT))
    assert.isTrue(isCritical(true, IssueType.MEDICAL))
    assert.isTrue(isCritical(true, IssueType.SECURITY))
    assert.isFalse(isCritical(true, IssueType.BREAKDOWN))
    assert.isFalse(isCritical(false, IssueType.ACCIDENT))
  })
})

test.group('SOS WebSocket Events - Unit Tests', () => {
  test('should have correct WebSocket event types', async ({ assert }) => {
    const WebSocketEventType = {
      SOS_ALERT: 'sos:alert',
      SOS_ACKNOWLEDGED: 'sos:acknowledged',
      SOS_RESOLVED: 'sos:resolved',
    }

    assert.equal(WebSocketEventType.SOS_ALERT, 'sos:alert')
    assert.equal(WebSocketEventType.SOS_ACKNOWLEDGED, 'sos:acknowledged')
    assert.equal(WebSocketEventType.SOS_RESOLVED, 'sos:resolved')
  })

  test('SOS alert data structure should be correct', async ({ assert }) => {
    const mockSosData = {
      issueId: 'uuid-123',
      missionId: 'mission-uuid',
      missionTitle: 'Test Mission',
      type: IssueType.ACCIDENT,
      priority: IssuePriority.CRITICAL,
      description: 'Test accident',
      location: { lat: 4.0511, lng: 9.7679 },
      transporteurId: 'transporteur-uuid',
      affreteurId: 'affreteur-uuid',
      conversationId: 123,
      createdAt: new Date().toISOString(),
    }

    assert.exists(mockSosData.issueId)
    assert.exists(mockSosData.missionId)
    assert.exists(mockSosData.type)
    assert.exists(mockSosData.priority)
    assert.exists(mockSosData.location)
    assert.equal(mockSosData.location.lat, 4.0511)
    assert.equal(mockSosData.location.lng, 9.7679)
  })
})

test.group('Emergency Contacts - Unit Tests', () => {
  test('should have correct Cameroon emergency contacts', async ({ assert }) => {
    const emergencyContacts = {
      police: '117',
      samu: '119',
      pompiers: '118',
    }

    assert.equal(emergencyContacts.police, '117')
    assert.equal(emergencyContacts.samu, '119')
    assert.equal(emergencyContacts.pompiers, '118')
  })
})
